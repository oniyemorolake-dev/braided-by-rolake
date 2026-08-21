import {
  CONFIG,
  DISCOUNT_PRICE_FLOOR,
  FIRST_TIME_CODE,
  FIRST_TIME_DISCOUNT,
  FIRST_TIME_ENABLED,
  LOYALTY_DISCOUNT,
  LOYALTY_ENABLED,
  LOYALTY_THRESHOLD,
  REFERRAL_DISCOUNT_FRIEND,
  REFERRAL_DISCOUNT_REFERRER,
  REFERRAL_ENABLED,
  type DiscountStatus,
  type DiscountType,
} from '../data'
import { isSupabaseConfigured, supabase } from './supabase'

export interface DiscountRecord {
  id: string
  code: string
  type: DiscountType
  amount: number
  status: DiscountStatus
  ownerEmail?: string
  usedByEmail?: string
  usedBookingId?: string
  note?: string
  createdAt: string
  usedAt?: string
}

export interface ValidateDiscountResult {
  ok: boolean
  code?: string
  type?: DiscountType
  amount?: number
  listedAmount?: number
  finalPrice?: number
  message: string
  referrerEmail?: string
  referrerRewardCode?: string
  referrerRewardAmount?: number
}

interface DiscountRow {
  id: string
  code: string
  type: DiscountType
  amount: number
  status: DiscountStatus
  owner_email: string | null
  used_by_email: string | null
  used_booking_id: string | null
  note: string | null
  created_at: string
  used_at: string | null
}

function rowToDiscount(row: DiscountRow): DiscountRecord {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    amount: Number(row.amount),
    status: row.status,
    ownerEmail: row.owner_email ?? undefined,
    usedByEmail: row.used_by_email ?? undefined,
    usedBookingId: row.used_booking_id ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    usedAt: row.used_at ?? undefined,
  }
}

function parseValidate(data: Record<string, unknown> | null): ValidateDiscountResult {
  if (!data) return { ok: false, message: 'Could not validate code.' }
  return {
    ok: Boolean(data.ok),
    code: typeof data.code === 'string' ? data.code : undefined,
    type: typeof data.type === 'string' ? (data.type as DiscountType) : undefined,
    amount: data.amount != null ? Number(data.amount) : undefined,
    listedAmount: data.listed_amount != null ? Number(data.listed_amount) : undefined,
    finalPrice: data.final_price != null ? Number(data.final_price) : undefined,
    message: typeof data.message === 'string' ? data.message : data.ok ? 'Applied' : 'Invalid code',
    referrerEmail: typeof data.referrer_email === 'string' ? data.referrer_email : undefined,
    referrerRewardCode:
      typeof data.referrer_reward_code === 'string' ? data.referrer_reward_code : undefined,
    referrerRewardAmount:
      data.referrer_reward_amount != null ? Number(data.referrer_reward_amount) : undefined,
  }
}

export async function checkFirstTimeEligible(
  email: string,
): Promise<{ eligible: boolean; reason?: string }> {
  if (!FIRST_TIME_ENABLED) return { eligible: false, reason: 'First-time discount is paused.' }
  if (!supabase || !isSupabaseConfigured) {
    return { eligible: false, reason: 'Discounts require online booking.' }
  }
  const { data, error } = await supabase.rpc('check_first_time_eligible', {
    p_email: email.trim(),
  })
  if (error) {
    console.error('[discounts] first-time check failed', error.message)
    return { eligible: false, reason: error.message }
  }
  const row = data as { eligible?: boolean; reason?: string }
  return { eligible: Boolean(row?.eligible), reason: row?.reason }
}

export async function validateDiscountCode(
  code: string,
  email: string,
  subtotal: number,
): Promise<ValidateDiscountResult> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, message: 'Discounts require online booking.' }
  }
  const { data, error } = await supabase.rpc('validate_discount_code', {
    p_code: code.trim().toUpperCase(),
    p_email: email.trim(),
    p_subtotal: subtotal,
    p_price_floor: DISCOUNT_PRICE_FLOOR,
  })
  if (error) {
    console.error('[discounts] validate failed', error.message)
    return { ok: false, message: error.message }
  }
  return parseValidate(data as Record<string, unknown>)
}

export async function redeemDiscountCode(
  code: string,
  email: string,
  bookingId: string,
  subtotal: number,
): Promise<ValidateDiscountResult> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, message: 'Discounts require online booking.' }
  }
  const { data, error } = await supabase.rpc('redeem_discount_code', {
    p_code: code.trim().toUpperCase(),
    p_email: email.trim(),
    p_booking_id: bookingId,
    p_subtotal: subtotal,
    p_price_floor: DISCOUNT_PRICE_FLOOR,
    p_referrer_reward_amount: REFERRAL_ENABLED ? REFERRAL_DISCOUNT_REFERRER : null,
  })
  if (error) {
    console.error('[discounts] redeem failed', error.message)
    return { ok: false, message: error.message }
  }
  return parseValidate(data as Record<string, unknown>)
}

/** Auto-apply first-time via WELCOME when eligible and no other code entered */
export async function redeemFirstTimeIfEligible(
  email: string,
  bookingId: string,
  subtotal: number,
): Promise<ValidateDiscountResult | null> {
  if (!FIRST_TIME_ENABLED) return null
  const check = await checkFirstTimeEligible(email)
  if (!check.eligible) return null
  return redeemDiscountCode(FIRST_TIME_CODE, email, bookingId, subtotal)
}

export async function ensureReferralCode(
  email: string,
): Promise<{ ok: boolean; code?: string; amount?: number; message?: string }> {
  if (!REFERRAL_ENABLED) return { ok: false, message: 'Referral program is paused.' }
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, message: 'Referrals require online booking.' }
  }
  const { data, error } = await supabase.rpc('ensure_referral_code', {
    p_email: email.trim(),
    p_friend_amount: REFERRAL_DISCOUNT_FRIEND,
  })
  if (error) {
    return { ok: false, message: error.message }
  }
  const row = data as { ok?: boolean; code?: string; amount?: number; message?: string }
  return {
    ok: Boolean(row?.ok),
    code: row?.code,
    amount: row?.amount != null ? Number(row.amount) : undefined,
    message: row?.message,
  }
}

export async function maybeIssueLoyaltyCode(
  email: string,
): Promise<{ issued: boolean; code?: string; amount?: number; count?: number }> {
  if (!LOYALTY_ENABLED) return { issued: false }
  if (!supabase || !isSupabaseConfigured) return { issued: false }
  const { data, error } = await supabase.rpc('maybe_issue_loyalty_code', {
    p_email: email.trim(),
    p_threshold: LOYALTY_THRESHOLD,
    p_amount: LOYALTY_DISCOUNT,
  })
  if (error) {
    console.error('[discounts] loyalty issue failed', error.message)
    return { issued: false }
  }
  const row = data as {
    issued?: boolean
    code?: string
    amount?: number
    count?: number
  }
  return {
    issued: Boolean(row?.issued),
    code: row?.code,
    amount: row?.amount != null ? Number(row.amount) : undefined,
    count: row?.count != null ? Number(row.count) : undefined,
  }
}

export async function adminListDiscounts(
  password = CONFIG.adminPassword,
): Promise<DiscountRecord[]> {
  if (!supabase || !isSupabaseConfigured) return []
  const { data, error } = await supabase.rpc('admin_list_discounts', {
    p_password: password,
  })
  if (error) throw new Error(error.message)
  return (data as DiscountRow[]).map(rowToDiscount)
}

export async function adminCreateDiscount(input: {
  code: string
  type: DiscountType
  amount: number
  ownerEmail?: string
  note?: string
  password?: string
}): Promise<DiscountRecord> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase required')
  }
  const { data, error } = await supabase.rpc('admin_create_discount', {
    p_password: input.password ?? CONFIG.adminPassword,
    p_code: input.code.trim().toUpperCase(),
    p_type: input.type,
    p_amount: input.amount,
    p_owner_email: input.ownerEmail?.trim() || null,
    p_note: input.note?.trim() || null,
  })
  if (error) throw new Error(error.message)
  return rowToDiscount(data as DiscountRow)
}

export async function adminSetDiscountStatus(
  id: string,
  status: DiscountStatus,
  password = CONFIG.adminPassword,
): Promise<DiscountRecord> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase required')
  }
  const { data, error } = await supabase.rpc('admin_set_discount_status', {
    p_password: password,
    p_id: id,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  return rowToDiscount(data as DiscountRow)
}

export function discountTypeLabel(type: DiscountType): string {
  switch (type) {
    case 'first_time':
      return 'First-time'
    case 'referral':
      return 'Referral'
    case 'loyalty':
      return 'Loyalty'
    case 'review':
      return 'Review'
    case 'promo':
      return 'Promo'
  }
}
