/**
 * API Configuration and Base Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🚀 [API CLIENT] Request:', {
      url,
      method: options.method || 'GET',
      endpoint
    });
    
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    if (token && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 [API CLIENT] Token added to request');
    }

    // Merge with provided headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      console.log('⏳ [API CLIENT] Fetching...');
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 [API CLIENT] Response status:', response.status, response.statusText);

      const data = await response.json();
      
      console.log('📦 [API CLIENT] Response data:', data);

      if (!response.ok) {
        console.error('❌ [API CLIENT] Request failed:', {
          status: response.status,
          data
        });
        throw new Error(data.message || data.error || 'Request failed');
      }

      console.log('✅ [API CLIENT] Request successful');
      return data;
    } catch (error) {
      console.error('💥 [API CLIENT] Error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
