import { CONFIG } from '../data'
import { isSupabaseConfigured, supabase } from './supabase'

export type ReviewStatus = 'pending' | 'approved' | 'hidden'

export interface Review {
  id: string
  name: string
  rating: number
  text: string
  style?: string
  status: ReviewStatus
  createdAt: string
}

interface ReviewRow {
  id: string
  name: string
  rating: number
  text: string
  style: string | null
  status: ReviewStatus
  created_at: string
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    name: row.name,
    rating: Number(row.rating),
    text: row.text,
    style: row.style ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function generateReviewId(): string {
  return `rv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Public: approved reviews only (RLS-enforced). */
export async function loadApprovedReviews(): Promise<Review[]> {
  if (!supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[reviews] load approved failed', error.message)
    throw new Error(error.message)
  }

  return (data as ReviewRow[]).map(rowToReview)
}

export type NewReviewInput = {
  name: string
  rating: number
  text: string
  style?: string
}

/** Public: insert a pending review. */
export async function submitReview(input: NewReviewInput): Promise<Review> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Reviews require Supabase to be configured.')
  }

  const rating = Math.round(input.rating)
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.')

  const row: ReviewRow = {
    id: generateReviewId(),
    name: input.name.trim(),
    rating,
    text: input.text.trim(),
    style: input.style?.trim() ? input.style.trim() : null,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  if (!row.name || !row.text) {
    throw new Error('Name and review text are required.')
  }

  // Pending rows are not SELECT-able by public RLS — insert without returning
  const { error } = await supabase.from('reviews').insert(row)

  if (error) {
    console.error('[reviews] insert failed', error.message)
    throw new Error(error.message)
  }

  return rowToReview(row)
}

/** Admin: list all reviews (password-gated RPC). */
export async function loadAllReviewsAdmin(password = CONFIG.adminPassword): Promise<Review[]> {
  if (!supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('admin_list_reviews', {
    p_password: password,
  })

  if (error) {
    console.error('[reviews] admin list failed', error.message)
    throw new Error(error.message)
  }

  return (data as ReviewRow[]).map(rowToReview)
}

/** Admin: approve or hide a review (password-gated RPC). */
export async function setReviewStatusAdmin(
  id: string,
  status: ReviewStatus,
  password = CONFIG.adminPassword,
): Promise<Review> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Reviews require Supabase to be configured.')
  }

  const { data, error } = await supabase.rpc('admin_set_review_status', {
    p_id: id,
    p_status: status,
    p_password: password,
  })

  if (error) {
    console.error('[reviews] set status failed', error.message)
    throw new Error(error.message)
  }

  return rowToReview(data as ReviewRow)
}

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}
