// src/services/apiClient.ts
// Centralized API client service - Single source of truth for all API interactions

// Defines the standard shape for our API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API client configuration
const API_BASE_URL = '/api';

// Helper function to clean and normalize endpoints
const normalizeEndpoint = (endpoint: string): string => {
  // Remove any leading "/api" and ensure a single leading slash
  let cleanEndpoint = endpoint.replace(/^\/api/, '').replace(/^\/+/, '');
  // Construct the final, guaranteed-correct URL
  return `/${cleanEndpoint}`;
};

// Centralized API client with robust error handling
const apiClient = {
  /**
   * GET request with standardized error handling
   */
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    // --- THE HARDENING LOGIC ---
    // Clean up the endpoint to remove any leading "/api" and ensure a single leading slash
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    // --- END HARDENING LOGIC ---

    // For debugging, we can log the final URL to confirm its correctness
    console.log(`[apiClient] Making GET request to: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Critical for sending auth cookies
        credentials: 'include',
      });

      // Specifically handle 404s to give a clear error message
      if (response.status === 404) {
        throw new Error(`API Route Not Found: GET ${url}`);
      }
      
      // Handle all other non-successful responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        const error = new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        // Attach response data for useMutation error handling
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Client Error (GET ${url}):`, error);
      throw error;
    }
  },

  /**
   * POST request with standardized error handling
   */
  post: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    // --- THE HARDENING LOGIC ---
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    // --- END HARDENING LOGIC ---

    console.log(`[apiClient] Making POST request to: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.status === 404) {
        throw new Error(`API Route Not Found: POST ${url}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        const error = new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        // Attach response data for useMutation error handling
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Client Error (POST ${url}):`, error);
      throw error;
    }
  },

  /**
   * PUT request with standardized error handling
   */
  put: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    // --- THE HARDENING LOGIC ---
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    // --- END HARDENING LOGIC ---

    console.log(`[apiClient] Making PUT request to: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.status === 404) {
        throw new Error(`API Route Not Found: PUT ${url}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        const error = new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        // Attach response data for useMutation error handling
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Client Error (PUT ${url}):`, error);
      throw error;
    }
  },

  /**
   * DELETE request with standardized error handling
   * Now supports optional body parameter for secure operations like account deletion
   */
  delete: async <T>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    // --- THE HARDENING LOGIC ---
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    // --- END HARDENING LOGIC ---

    console.log(`[apiClient] Making DELETE request to: ${url}`, body ? `with body: ${JSON.stringify(body)}` : 'without body');

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        // CRITICAL FIX: Include body if provided
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 404) {
        throw new Error(`API Route Not Found: DELETE ${url}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        const error = new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        // Attach response data for useMutation error handling
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
      
      // Handle responses that might not have a body
      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (error: any) {
      console.error(`API Client Error (DELETE ${url}):`, error);
      throw error;
    }
  },

  /**
   * PATCH request with standardized error handling
   */
  patch: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    // --- THE HARDENING LOGIC ---
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    // --- END HARDENING LOGIC ---

    console.log(`[apiClient] Making PATCH request to: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.status === 404) {
        throw new Error(`API Route Not Found: PATCH ${url}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        const error = new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        // Attach response data for useMutation error handling
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Client Error (PATCH ${url}):`, error);
      throw error;
    }
  }
};

export default apiClient;
