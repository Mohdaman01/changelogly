/**
 * Encryption utilities for sensitive data (webhook secrets, GitHub tokens)
 * Uses Web Crypto API (Node.js crypto.subtle polyfill)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16  // 128 bits (standard for GCM)
const AUTH_TAG_LENGTH = 16

// Get encryption key from env or generate for dev
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY
  if (!keyEnv) {
    console.warn('[encryption] ENCRYPTION_KEY not set. Using random key for this session.')
    return randomBytes(KEY_LENGTH)
  }

  // Key should be base64-encoded 32-byte string
  const key = Buffer.from(keyEnv, 'base64')
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `[encryption] ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64-encoded). Got ${key.length}`
    )
  }
  return key
}

/**
 * Encrypt plaintext secret
 * Returns: base64(iv + ciphertext + authTag)
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'binary')
  encrypted += cipher.final('binary')

  const authTag = cipher.getAuthTag()

  // Combine: IV (16) + authTag (16) + ciphertext (variable)
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'binary'),
  ])

  return combined.toString('base64')
}

/**
 * Decrypt base64-encoded secret
 */
export function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encrypted, 'base64')

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('[encryption] Invalid encrypted secret: too short')
  }

  const iv = combined.slice(0, IV_LENGTH)
  const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext.toString('binary'), 'binary', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate a secure random secret (for webhook secrets)
 * Returns 32 random bytes as hex string (64 chars)
 */
export function generateSecret(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Verify HMAC-SHA256 signature (for GitHub webhooks)
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const { createHmac, timingSafeEqual } = require('crypto')
  
  const hash = createHmac('sha256', secret)
  hash.update(payload)
  const digest = 'sha256=' + hash.digest('hex')
  
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  } catch {
    return false
  }
}
