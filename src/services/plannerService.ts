import apiClient from './apiClient';

export interface PlannerPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  budget: string;
  budgetLevel?: string;
  pace?: string;
  style?: string;
  travelers?: number;
}

export interface CheckpointData {
  checkpoint_id: string;
  session_id: string;
  data: any;
  prompt: string;
}

export interface ProgressData {
  stage: string;
  progress: number;
}

export interface CompleteData {
  itinerary_id: string;
  itinerary: any;
}

/**
 * Generate itinerary with SSE streaming.
 */
export async function generateItinerary(
  preferences: PlannerPreferences,
  callbacks: {
    onProgress?: (data: ProgressData) => void;
    onCheckpoint?: (data: CheckpointData) => void;
    onComplete?: (data: CompleteData) => void;
    onError?: (error: Error) => void;
  }
): Promise<CompleteData | null> {
  // Use relative path to go through Vite proxy
  const API_URL = '/api/planner/generate';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: null, // Will be set by backend if authenticated
        inputs: preferences
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('No response body');
    }

    let result: CompleteData | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.substring(7).trim();
          continue;
        }
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          try {
            const data = JSON.parse(dataStr);

            // Handle different event types
            if (data.stage) {
              // Progress event
              callbacks.onProgress?.({
                stage: data.stage,
                progress: data.progress || 0
              });
            } else if (data.checkpoint_id) {
              // Checkpoint event
              callbacks.onCheckpoint?.(data as CheckpointData);
            } else if (data.itinerary_id) {
              // Complete event
              result = data as CompleteData;
              callbacks.onComplete?.(result);
            }
          } catch (e) {
            console.warn('[plannerService] Failed to parse SSE data:', e);
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[plannerService] Error generating itinerary:', error);
    callbacks.onError?.(error as Error);
    throw error;
  }
}

/**
 * Send feedback to resume graph from checkpoint.
 */
export async function sendFeedback(
  sessionId: string,
  checkpointId: string,
  feedback: any
): Promise<void> {
  // Use relative path to go through Vite proxy
  const API_URL = '/api/planner/feedback';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        checkpoint_id: checkpointId,
        feedback
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('[plannerService] Error sending feedback:', error);
    throw error;
  }
}

/**
 * Get itinerary by ID.
 */
export async function getItineraryById(id: string): Promise<any> {
  try {
    const response = await apiClient.get(`/api/itineraries/${id}`);
    return response.data;
  } catch (error) {
    console.error('[plannerService] Error getting itinerary:', error);
    throw error;
  }
}

/**
 * Update itinerary.
 */
export async function updateItinerary(id: string, updates: any): Promise<any> {
  try {
    const response = await apiClient.patch(`/api/itineraries/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('[plannerService] Error updating itinerary:', error);
    throw error;
  }
}

/**
 * Delete itinerary (soft delete).
 */
export async function deleteItinerary(id: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/itineraries/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.status}`);
    }
  } catch (error) {
    console.error('[plannerService] Error deleting itinerary:', error);
    throw error;
  }
}

/**
 * Get user's itineraries.
 */
export async function getUserItineraries(userId: string, filters?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const query = params.toString();
    const url = `/api/itineraries${query ? `?${query}` : ''}`;

    // We can't use apiClient here easily if it doesn't support custom headers per request cleanly, 
    // or we can just use fetch like saveItinerary
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch itineraries: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[plannerService] Error getting user itineraries:', error);
    throw error;
  }
}

/**
 * Save a new itinerary to database.
 * Requires user to be logged in.
 */
export async function saveItinerary(data: {
  name: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  travelers: number;
  budget?: string;
  travel_style?: string;
  itinerary_content: any;
  hotel?: any;
  selected_tours?: string[];
  total_cost: number;
}, userId: string): Promise<any> {
  try {
    const response = await fetch('/api/itineraries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      // Try to parse as JSON first
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        throw new Error(error.detail || `Server error: ${response.status}`);
      } catch (e) {
        // If not JSON, throw text or generic error
        console.error('[plannerService] Raw error response:', text);
        throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`);
      }
    }

    // For successful responses, also handle potential empty body
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : { success: true };
    } catch (e) {
      console.warn('[plannerService] Succesful response was not JSON:', text);
      return { success: true };
    }
  } catch (error) {
    console.error('[plannerService] Error saving itinerary:', error);
    throw error;
  }
}

// --- Micro-Agent Endpoints ---

export async function runResearch(data: {
  destination: string;
  dates?: { start: string; end: string };
  budget?: number;
  style?: string;
  interests?: string[];
}) {
  const response = await fetch('/api/agents/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Research failed');
  return response.json();
}

export async function runHotelSearch(data: {
  destination_id: string;
  check_in: string;
  check_out: string;
  budget?: number;
  guests?: number;
}) {
  const response = await fetch('/api/agents/hotel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Hotel search failed');
  return response.json();
}

export async function runPlanning(data: {
  destination_id: string;
  dates: { start: string; end: string };
  selected_tours: string[];
  tours_data: any[];
  selected_hotel: string;
  hotel_data: any;
}) {
  const response = await fetch('/api/agents/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Planning failed');
  return response.json();
}
