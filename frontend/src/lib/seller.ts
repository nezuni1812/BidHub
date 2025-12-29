/**
 * Seller API Service
 */

import { api } from './api';

export interface SellerStats {
  active_products: number;
  sold_products: number;
  total_revenue: string;
  average_rating: string;
}

export interface SellerProduct {
  id: number;
  title: string;
  current_price: string;
  bid_count: number;
  views: number;
  end_time: string;
  status: string;
  main_image: string;
}

export interface SellerOrder {
  id: number;
  product_id: number;
  product_title: string;
  product_image: string;
  buyer_id: number;
  buyer_name: string;
  buyer_email: string;
  buyer_address: string | null;
  total_price: string;
  final_price: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  paid_at: string | null;
  buyer_rating?: number | null;
  seller_rating?: number | null;
  buyer_rated_at?: string | null;
  seller_rated_at?: string | null;
}

/**
 * Get seller dashboard statistics
 */
export async function getSellerStats(): Promise<SellerStats> {
  try {
    console.log('🔄 Calling /seller/stats API...');
    const response = await api.get('/seller/stats');
    console.log('✅ Stats API response:', response.data);
    
    if (response.data && response.data.data) {
      console.log('📊 Stats data:', response.data.data);
      return response.data.data;
    }
    
    console.warn('⚠️ Unexpected response structure:', response.data);
    return {
      active_products: 0,
      sold_products: 0,
      total_revenue: '0',
      average_rating: '0.00'
    };
  } catch (error: any) {
    console.error('❌ Error fetching seller stats:', error);
    console.error('Error details:', error.response?.data || error.message);
    return {
      active_products: 0,
      sold_products: 0,
      total_revenue: '0',
      average_rating: '0.00'
    };
  }
}

/**
 * Get seller's active products
 */
export async function getSellerProducts(page = 1, pageSize = 10) {
  const response = await api.get(`/seller/products/active?page=${page}&page_size=${pageSize}`);
  return response.data;
}

/**
 * Get seller's orders (sold items)
 */
export async function getSellerOrders(page = 1, pageSize = 10) {
  const response = await api.get(`/orders/seller?page=${page}&page_size=${pageSize}`);
  return response.data;
}

/**
 * Update order shipping status (seller marks as shipped)
 */
export async function markAsShipped(orderId: number, trackingNumber?: string) {
  const response = await api.put(`/orders/${orderId}/shipping`, {
    tracking_number: trackingNumber || ''
  });
  return response.data;
}

/**
 * Cancel order (seller can cancel anytime)
 */
export async function cancelOrder(orderId: number, reason?: string) {
  const response = await api.put(`/orders/${orderId}/cancel`, {
    reason: reason || ''
  });
  return response.data;
}

/**
 * Rate buyer (seller rates buyer)
 */
export async function rateBuyer(orderId: number, rating: 1 | -1, comment?: string) {
  const response = await api.post(`/orders/${orderId}/rate`, {
    rating,
    comment: comment || ''
  });
  return response.data;
}

