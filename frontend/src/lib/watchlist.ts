/**
 * Watchlist API Service
 */

import { api } from './api';
import type { Product } from './products';

export interface WatchlistResponse {
  data: Product[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Add product to watchlist
 */
export const addToWatchlist = async (productId: number): Promise<void> => {
  await api.post('/bidder/watchlist', { product_id: productId });
};

/**
 * Remove product from watchlist
 */
export const removeFromWatchlist = async (productId: number): Promise<void> => {
  await api.delete(`/bidder/watchlist/${productId}`);
};

/**
 * Get user's watchlist
 */
export const getWatchlist = async (page: number = 1, page_size: number = 20): Promise<WatchlistResponse> => {
  const response = await api.get<any>(`/bidder/watchlist?page=${page}&page_size=${page_size}`);
  
  console.log('🔧 [WATCHLIST_LIB] Raw response:', response);
  
  // API returns { success, data: [...], pagination: {...} }
  // Cast to any to access pagination field
  const responseData = response as any;
  
  return {
    data: responseData.data || [],
    pagination: responseData.pagination || { page: 1, page_size: 20, total: 0, total_pages: 0 }
  };
};

/**
 * Check if product is in watchlist
 * Note: Backend doesn't have /check endpoint, so we check by getting the full list
 */
export const isInWatchlist = async (productId: number): Promise<boolean> => {
  try {
    const watchlist = await getWatchlist(1, 100);
    return watchlist.data.some(item => parseInt((item as any).product_id) === productId);
  } catch {
    return false;
  }
};
