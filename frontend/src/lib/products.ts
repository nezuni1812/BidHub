/**
 * Product API Service
 */

import { api } from './api';

export interface Product {
  id: number | string;
  title: string;
  current_price: number | string;
  buy_now_price?: number | string;
  starting_price?: number | string;
  bid_step?: number | string;
  total_bids: number | string;
  end_time: string;
  start_time?: string;
  created_at: string;
  status?: string;
  category_name: string;
  category_id: number | string;
  seller_name: string;
  seller_rating: number | string;
  seller_id?: number | string;
  main_image?: string;
  highest_bidder_name?: string;
  seconds_remaining?: number | string;
  minutes_since_created?: number | string;
  description?: string;
  images?: ProductImage[];
  questions?: ProductQuestion[];
  related_products?: Product[];
  description_history?: DescriptionHistory[];
  winner_id?: number | string;
  winner_name?: string;
  winner_rating?: number | string;
}

export interface ProductImage {
  id: number;
  url: string;
  is_main: boolean;
}

export interface ProductQuestion {
  id: number;
  question: string;
  answer?: string;
  created_at: string;
  answered_at?: string;
  asker_name: string;
}

export interface DescriptionHistory {
  additional_description: string;
  created_at: string;
}

export interface Bid {
  id: number;
  bid_price: number;
  is_auto: boolean;
  created_at: string;
  masked_bidder_name: string;
}

export interface HomePageData {
  ending_soon: Product[];
  most_bids: Product[];
  highest_price: Product[];
}

export interface ProductSearchParams {
  keyword?: string;
  category_id?: number;
  sort_by?: 'end_time_asc' | 'end_time_desc' | 'price_asc' | 'price_desc';
  page?: number;
  page_size?: number;
}

export interface ProductSearchResponse {
  data: Product[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface BidHistoryResponse {
  data: Bid[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Get homepage products (top 5 ending soon, most bids, highest price)
 */
export const getHomePageProducts = async (): Promise<HomePageData> => {
  const response = await api.get<HomePageData>('/products/home');
  return response.data!;
};

/**
 * Search and filter products
 */
export const searchProducts = async (
  params: ProductSearchParams
): Promise<ProductSearchResponse> => {
  console.log('🔧 [PRODUCTS API] searchProducts called with params:', params);
  
  const queryParams = new URLSearchParams();
  
  if (params.keyword) queryParams.append('keyword', params.keyword);
  if (params.category_id) queryParams.append('category_id', params.category_id.toString());
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size) queryParams.append('page_size', params.page_size.toString());
  
  const queryString = queryParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
  
  console.log('🌐 [PRODUCTS API] Calling endpoint:', endpoint);
  
  const response = await api.get<any>(endpoint);
  
  console.log('📥 [PRODUCTS API] Raw response:', response);
  console.log('📦 [PRODUCTS API] response.data:', response.data);
  console.log('✅ [PRODUCTS API] response.success:', response.success);
  
  // Backend returns: { success: true, data: [...], pagination: {...} }
  // We need to return: { data: [...], pagination: {...} }
  if (response.success && response.data) {
    console.log('✨ [PRODUCTS API] Returning structured response');
    const fullResponse = response as any;
    return {
      data: fullResponse.data,
      pagination: fullResponse.pagination || {
        page: 1,
        page_size: 20,
        total: 0,
        total_pages: 0
      }
    };
  }
  
  console.log('⚠️ [PRODUCTS API] Returning response as-is');
  // Fallback
  return response as any as ProductSearchResponse;
};

/**
 * Get product detail by ID
 */
export const getProductById = async (id: number | string): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  console.log('🔧 [PRODUCTS API] getProductById response:', response);
  
  // API returns { success: true, data: {...} }
  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Failed to fetch product');
};

/**
 * Get product bid history
 */
export const getProductBids = async (
  id: number | string,
  page: number = 1,
  page_size: number = 20
): Promise<BidHistoryResponse> => {
  const response = await api.get<any>(
    `/products/${id}/bids?page=${page}&page_size=${page_size}`
  );
  
  // Backend returns: { success: true, data: [...], pagination: {...} }
  if (response.success) {
    const fullResponse = response as any;
    return {
      data: fullResponse.data || [],
      pagination: fullResponse.pagination || {
        page: 1,
        page_size: 20,
        total: 0,
        total_pages: 0
      }
    };
  }
  
  return response as any as BidHistoryResponse;
};

/**
 * Format price to VND currency
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Calculate time remaining from seconds
 */
/**
 * Format time remaining with relative time for < 3 days, date format for >= 3 days
 * Yêu cầu: 
 * - Nếu < 3 ngày: hiển thị relative time (3 ngày nữa, 10 phút nữa)
 * - Nếu >= 3 ngày: hiển thị ngày tháng năm (dd/mm/yyyy HH:mm)
 */
// Helper: convert UTC ISO string to Date in GMT+7
export function toGmt7Date(dateStr: string) {
  const d = new Date(dateStr);
  // Lấy giờ UTC + 7
  return new Date(d.getTime() + 7 * 60 * 60000);
}

export const formatTimeRemaining = (seconds: number, endTimeIso?: string): string => {
  if (seconds <= 0) return 'Đã kết thúc';

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  // If >= 3 days, show end date/time (dd/mm/yyyy HH:mm) in GMT+7
  if (days >= 3 && endTimeIso) {
    const endTime = toGmt7Date(endTimeIso);
    const day = String(endTime.getDate()).padStart(2, '0');
    const month = String(endTime.getMonth() + 1).padStart(2, '0');
    const year = endTime.getFullYear();
    const hour = String(endTime.getHours()).padStart(2, '0');
    const minute = String(endTime.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  // If < 3 days, show relative format (with "nữa")
  if (days > 0) {
    if (hours > 0) {
      return `${days} ngày ${hours} giờ nữa`;
    }
    return `${days} ngày nữa`;
  }

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} giờ ${minutes} phút nữa`;
    }
    return `${hours} giờ nữa`;
  }

  return `${minutes} phút nữa`;
};

/**
 * Get full image URL (handle relative paths)
 */
export const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return '/placeholder.svg';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the API base URL (without /api/v1)
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const serverUrl = baseUrl.replace('/api/v1', '');
  return `${serverUrl}${imagePath}`;
};
