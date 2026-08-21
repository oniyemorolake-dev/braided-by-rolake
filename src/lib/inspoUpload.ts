import { isSupabaseConfigured, supabase } from './supabase'

export const INSPO_MAX_BYTES = 20 * 1024 * 1024 // 20MB
export const INSPO_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.mov'

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
])

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'])

function extOf(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ALLOWED_EXT.has(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/quicktime') return 'mov'
  return fromName
}

export function validateInspoFile(file: File): string | null {
  if (file.size > INSPO_MAX_BYTES) {
    return 'That file is too large. Please keep inspo under 20MB — a photo or short clip works best.'
  }
  const ext = extOf(file)
  const mimeOk = ALLOWED_MIME.has(file.type) || file.type === ''
  const extOk = ALLOWED_EXT.has(ext) || ALLOWED_EXT.has(file.name.split('.').pop()?.toLowerCase() ?? '')
  if (!mimeOk && !extOk) {
    return 'Please upload a photo (JPG, PNG, WebP) or short video (MP4, MOV).'
  }
  if (!ALLOWED_EXT.has(ext) && !ALLOWED_EXT.has(file.name.split('.').pop()?.toLowerCase() ?? '')) {
    return 'Please upload a photo (JPG, PNG, WebP) or short video (MP4, MOV).'
  }
  return null
}

export function isInspoVideo(url: string): boolean {
  return /\.(mp4|mov)(\?|$)/i.test(url)
}

/**
 * Upload inspo to the public `inspo` bucket.
 * Paths use random IDs so files can't be enumerated by guessing.
 */
export async function uploadInspoFile(file: File): Promise<string> {
  const validationError = validateInspoFile(file)
  if (validationError) throw new Error(validationError)

  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Uploads need an online connection. You can still book without inspo, or text me the photo.')
  }

  const ext = extOf(file) || 'bin'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('inspo').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) {
    console.error('[inspo] upload failed', error.message)
    throw new Error(error.message || 'Upload failed. Try a smaller file or skip for now.')
  }

  const { data } = supabase.storage.from('inspo').getPublicUrl(path)
  if (!data?.publicUrl) {
    throw new Error('Upload succeeded but we could not get a link. Please try again.')
  }
  return data.publicUrl
}
