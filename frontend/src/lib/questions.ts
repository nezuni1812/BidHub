/**
 * Questions API Service
 */

import { api } from './api';

export interface AskQuestionPayload {
  product_id: number;
  question: string;
}

export interface Question {
  id: number;
  product_id: number;
  user_id: number;
  question: string;
  answer?: string;
  created_at: string;
  answered_at?: string;
}

/**
 * Ask a question about a product
 */
export const askQuestion = async (payload: AskQuestionPayload): Promise<void> => {
  await api.post('/bidder/questions', payload);
};

/**
 * Get questions for a product
 */
export const getProductQuestions = async (productId: number): Promise<Question[]> => {
  const response = await api.get<Question[]>(`/products/${productId}/questions`);
  return response.data || [];
};
