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
  private isRefreshing: boolean = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('❌ No refresh token available');
      return null;
    }

    try {
      console.log('🔄 Attempting to refresh access token...');
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        throw new Error('Refresh token expired');
      }

      const data = await response.json();
      const newAccessToken = data.data.access_token;
      
      localStorage.setItem('access_token', newAccessToken);
      console.log('✅ Access token refreshed successfully');
      
      return newAccessToken;
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      // Clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🚀 [API CLIENT] Request:', {
      url,
      method: options.method || 'GET',
      endpoint,
      isRetry
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

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
        console.log('🔄 [API CLIENT] 401 detected, attempting token refresh...');
        
        if (this.isRefreshing) {
          // Wait for the refresh to complete
          return new Promise((resolve) => {
            this.refreshSubscribers.push((_token: string) => {
              // Retry with new token
              resolve(this.request<T>(endpoint, options, true));
            });
          });
        }

        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (newToken) {
          // Notify all waiting requests
          this.refreshSubscribers.forEach(callback => callback(newToken));
          this.refreshSubscribers = [];
          
          // Retry original request with new token
          return this.request<T>(endpoint, options, true);
        }
      }

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
    return this.request<T>(endpoint, { ...options, method: 'GET' }, false);
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, false);
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, false);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' }, false);
  }
}

export const api = new ApiClient(API_BASE_URL);
