from typing import Any, AsyncIterator, Dict, Optional, Tuple, Sequence
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple
from pymongo import MongoClient, AsyncMongoClient
from pymongo.collection import Collection
import pickle
import json
from loguru import logger
import base64

class MongoDBSaver(BaseCheckpointSaver):
    """A checkpoint saver that stores checkpoints in a MongoDB database."""

    client: MongoClient
    db_name: str
    collection_name: str

    def __init__(
        self, 
        uri: str, 
        db_name: str, 
        collection_name: str = "agent_checkpoints"
    ):
        super().__init__()
        self.client = MongoClient(uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]
        # Ensure index for faster lookups
        self.collection.create_index([("thread_id", 1), ("checkpoint_id", 1)], unique=True)
        self.collection.create_index([("thread_id", 1), ("ts", -1)])

    def get_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        """Get a checkpoint tuple from the database."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = config["configurable"].get("checkpoint_id")
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")

        query = {"thread_id": thread_id}
        if checkpoint_id:
            query["checkpoint_id"] = checkpoint_id
        
        # Determine sort order: if specific ID not requested, get latest
        sort_order = [("ts", -1)]
        
        doc = self.collection.find_one(query, sort=sort_order)
        
        if not doc:
            return None
            
        # Deserialize checkpoint and metadata
        checkpoint = pickle.loads(doc["checkpoint_blob"])
        metadata = pickle.loads(doc["metadata_blob"])
        parent_config = pickle.loads(doc["parent_config_blob"]) if doc.get("parent_config_blob") else doc.get("parent_config")
        
        return CheckpointTuple(
            config=config, 
            checkpoint=checkpoint, 
            metadata=metadata, 
            parent_config=parent_config
        )

    def list(
        self,
        config: Optional[RunnableConfig],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        """List checkpoints from the database."""
        # Simplified implementation - not strictly needed for basic resume
        query = {}
        if config:
            query["thread_id"] = config["configurable"]["thread_id"]
        
        cursor = self.collection.find(query).sort("ts", -1)
        if limit:
            cursor = cursor.limit(limit)
            
        for doc in cursor:
            checkpoint = pickle.loads(doc["checkpoint_blob"])
            metadata = pickle.loads(doc["metadata_blob"])
            parent_config = pickle.loads(doc["parent_config_blob"]) if doc.get("parent_config_blob") else doc.get("parent_config")
            yield CheckpointTuple(
                config={"configurable": {"thread_id": doc["thread_id"], "checkpoint_id": doc["checkpoint_id"]}},
                checkpoint=checkpoint,
                metadata=metadata,
                parent_config=parent_config
            )

    def put(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> RunnableConfig:
        """Save a checkpoint to the database."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = checkpoint["id"]
        
        # Serialize with pickle to handle complex types (like datetime, sets, custom objects)
        checkpoint_blob = pickle.dumps(checkpoint)
        metadata_blob = pickle.dumps(metadata)
        
        # Sanitize config before pickling (remove runtime objects)
        clean_config = config.copy()
        if "configurable" in clean_config:
            clean_config["configurable"] = clean_config["configurable"].copy()
            clean_config["configurable"].pop("__pregel_runtime", None)
            
        parent_config_blob = pickle.dumps(clean_config)
        
        doc = {
            "thread_id": thread_id,
            "checkpoint_id": checkpoint_id,
            "ts": checkpoint.get("ts"), # Timestamp for sorting
            "checkpoint_blob": checkpoint_blob,
            "metadata_blob": metadata_blob,
            "parent_config_blob": parent_config_blob
        }
        
        # Upsert
        self.collection.update_one(
            {"thread_id": thread_id, "checkpoint_id": checkpoint_id},
            {"$set": doc},
            upsert=True
        )
        
        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_id": checkpoint_id
            }
        }

    def put_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        """Store intermediate writes."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"].get("checkpoint_id")
        
        # Serialize writes
        writes_blob = pickle.dumps(writes)
        
        doc = {
            "thread_id": thread_id,
            "checkpoint_ns": checkpoint_ns,
            "checkpoint_id": checkpoint_id,
            "task_id": task_id,
            "writes_blob": writes_blob,
        }
        
        # We need a separate collection for writes or mix them. 
        # Using a suffix for simplicity
        writes_coll = self.db[f"{self.collection.name}_writes"]
        writes_coll.update_one(
            {"thread_id": thread_id, "checkpoint_id": checkpoint_id, "task_id": task_id},
            {"$set": doc},
            upsert=True
        )

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        return self.put_writes(config, writes, task_id)
        
    # Async methods (needed if LangGraph uses aget/aput)
    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
         # For simplicity in this sync-wrapper, just call sync method
         # In prod, use AsyncMongoClient, but here we can wrap or just reuse sync if event loop allows
         return self.get_tuple(config)

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> RunnableConfig:
        return self.put(config, checkpoint, metadata, new_versions)
        
    async def alist(
        self,
        config: Optional[RunnableConfig],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        iterator = self.list(config, filter=filter, before=before, limit=limit)
        for item in iterator:
            yield item
