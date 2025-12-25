import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likeCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'pending'],
        default: 'published' // Auto-publish for now, or 'pending' if moderation is needed
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for text search
StorySchema.index({ title: 'text', content: 'text', tags: 'text' });
StorySchema.index({ createdAt: -1 });
StorySchema.index({ likeCount: -1 });

// Update likeCount on save if needed, but manual handling is often cleaner
// StorySchema.pre('save', function(next) {
//   if (this.isModified('likes')) {
//     this.likeCount = this.likes.length;
//   }
//   next();
// });

const Story = mongoose.models.Story || mongoose.model('Story', StorySchema);

export default Story;
