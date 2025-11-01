import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generate a cryptographically secure API key
 * @returns A 43-character base64url-encoded API key
 */
export function generateApiKey(): string {
  // Generate 32 random bytes for high entropy
  const buffer = crypto.randomBytes(32);
  // Convert to base64url (URL-safe) format
  return buffer.toString("base64url");
}

/**
 * Hash an API key using bcrypt
 * @param apiKey The plaintext API key to hash
 * @returns A bcrypt hash of the API key
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(apiKey, saltRounds);
}

/**
 * Verify an API key against a hash
 * @param apiKey The plaintext API key to verify
 * @param hash The bcrypt hash to compare against
 * @returns True if the API key matches the hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

/**
 * Mask a tenant ID for display (show first 8 and last 4 chars)
 * Example: f448c280-3009-4120-b701-9f25b5e78ebb -> f448c280-****-****-****-********e8ebb
 */
export function maskTenantId(tenantId: string): string {
  if (tenantId.length < 12) {
    return tenantId; // Too short to mask meaningfully
  }

  // UUID format: 8-4-4-4-12
  const parts = tenantId.split("-");
  if (parts.length === 5) {
    return `${parts[0]}-****-****-****-********${parts[4].slice(-4)}`;
  }

  // Fallback for non-UUID format
  return `${tenantId.slice(0, 8)}****${tenantId.slice(-4)}`;
}
