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
}

/**
 * Get seller dashboard statistics
 * Calculates stats from products and orders
 */
export async function getSellerStats(): Promise<SellerStats> {
  try {
    // Get first page of products and orders (within validation limit)
    const [productsRes, ordersRes] = await Promise.all([
      api.get('/seller/products/active?page=1&page_size=100'),
      api.get('/orders/seller?page=1&page_size=100')
    ]);

    const productsData = productsRes.data?.data || [];
    const ordersData = ordersRes.data?.data || [];
    
    // Get totals from pagination if available
    const activeProducts = productsRes.data?.pagination?.total || productsData.length;
    
    // Calculate from available order data
    const paidOrders = ordersData.filter((order: any) => 
      order.payment_status === 'completed' || order.payment_status === 'paid'
    );
    
    // If we have pagination info, use total, otherwise use what we have
    const soldProducts = ordersRes.data?.pagination?.total 
      ? ordersData.filter((order: any) => order.payment_status === 'completed' || order.payment_status === 'paid').length
      : paidOrders.length;
    
    // Calculate total revenue from available paid orders
    const totalRevenue = paidOrders.reduce((sum: number, order: any) => {
      return sum + parseFloat(order.total_price || '0');
    }, 0);

    // Get seller ratings from available orders
    const ratings = ordersData
      .filter((order: any) => order.buyer_rating !== null && order.buyer_rating !== undefined)
      .map((order: any) => parseInt(order.buyer_rating));
    
    const averageRating = ratings.length > 0
      ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2)
      : '0.00';

    return {
      active_products: activeProducts,
      sold_products: soldProducts,
      total_revenue: totalRevenue.toString(),
      average_rating: averageRating
    };
  } catch (error) {
    console.error('Error fetching seller stats:', error);
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

