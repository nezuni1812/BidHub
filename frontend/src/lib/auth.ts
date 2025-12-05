/**
 * Authentication API Service
 */

import { api, type ApiResponse } from './api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'seller' | 'bidder';
  address?: string;
  date_of_birth?: string;
  rating?: number;
  total_ratings?: number;
  is_active: boolean;
  google_id?: string;
  auth_provider?: 'local' | 'google';
  avatar_url?: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  address: string;
  date_of_birth: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OTPVerifyData {
  email: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface OTPResponse {
  email: string;
  message: string;
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<ApiResponse<OTPResponse>> {
  return api.post('/auth/register', data);
}

/**
 * Verify OTP after registration
 */
export async function verifyOTP(data: OTPVerifyData): Promise<ApiResponse<AuthResponse>> {
  return api.post('/auth/verify-otp', data);
}

/**
 * Resend OTP
 */
export async function resendOTP(email: string): Promise<ApiResponse<OTPResponse>> {
  return api.post('/auth/resend-otp', { email });
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
  return api.post('/auth/login', data);
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<ApiResponse<{ access_token: string }>> {
  return api.post('/auth/refresh', { refresh_token: refreshToken });
}

/**
 * Logout (revoke refresh token on backend and clear local storage)
 */
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  // Try to revoke token on backend
  if (refreshToken) {
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
  }
  
  // Clear local storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Save auth data to localStorage
 */
export function saveAuthData(data: AuthResponse): void {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

/**
 * Google OAuth login
 */
export function loginWithGoogle(): void {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/google`;
}
