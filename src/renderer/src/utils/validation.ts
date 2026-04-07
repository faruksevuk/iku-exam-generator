const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateImageFile(file: File): ValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPEG, WebP and GIF images are accepted.' }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image must be smaller than 5 MB.' }
  }
  return { valid: true }
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

export function validateDuration(value: string): ValidationResult {
  const num = parseInt(value, 10)
  if (value && (isNaN(num) || num < 1 || num > 600)) {
    return { valid: false, error: 'Duration must be 1–600 minutes.' }
  }
  return { valid: true }
}

export function validatePoints(value: number): ValidationResult {
  if (value < 1 || value > 100) {
    return { valid: false, error: 'Points must be 1–100.' }
  }
  return { valid: true }
}
