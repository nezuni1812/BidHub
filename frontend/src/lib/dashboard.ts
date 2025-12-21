/**
 * Dashboard API Service
 */

import { api } from './api';

export interface BiddingProduct {
  id: number;
  product_id: number;
  title: string;
  current_price: string;
  my_bid_price: string;
  is_winning: boolean;
  total_bids: number;
  end_time: string;
  seconds_remaining: number;
  main_image: string;
  status: string;
}

export interface WonProduct {
  id: number;
  product_id: number;
  order_id?: number;
  title: string;
  final_price: string;
  seller_name: string;
  seller_email?: string;
  won_date: string;
  order_status?: string;
  main_image: string;
  buyer_rating?: number | null;
  seller_rating?: number | null;
  buyer_rated_at?: string | null;
  seller_rated_at?: string | null;
}

export interface DashboardResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

/**
 * Get user's active bids (products they are currently bidding on)
 */
export const getActiveBids = async (
  page: number = 1,
  page_size: number = 20
): Promise<DashboardResponse<BiddingProduct>> => {
  const response: any = await api.get(
    `/bidder/bidding?page=${page}&page_size=${page_size}`
  );
  
  return {
    data: response.data || [],
    pagination: response.pagination || { page: 1, page_size: 20, total_items: 0, total_pages: 0 }
  };
};

/**
 * Get user's won products (auctions they won)
 */
export const getWonProducts = async (
  page: number = 1,
  page_size: number = 20
): Promise<DashboardResponse<WonProduct>> => {
  const response: any = await api.get(
    `/bidder/won?page=${page}&page_size=${page_size}`
  );
  
  return {
    data: response.data || [],
    pagination: response.pagination || { page: 1, page_size: 20, total_items: 0, total_pages: 0 }
  };
};

/**
 * Confirm delivery (buyer confirms they received the item)
 */
export async function confirmDelivery(orderId: number) {
  const response = await api.put(`/orders/${orderId}/confirm-delivery`);
  return response.data;
}

/**
 * Rate seller (buyer rates seller)
 */
export async function rateSeller(orderId: number, rating: 1 | -1, comment?: string) {
  const response = await api.post(`/orders/${orderId}/rate`, {
    rating,
    comment: comment || ''
  });
  return response.data;
}

/**
 * Cancel order (buyer can cancel before payment)
 */
export async function cancelOrder(orderId: number, reason?: string) {
  const response = await api.put(`/orders/${orderId}/cancel`, {
    reason: reason || ''
  });
  return response.data;
}
