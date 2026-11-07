/**
 * Módulo de Criptografía de Sesión de Operador para Electromecánica Lince
 * Firma criptográfica HMAC-SHA256 compatible con Node.js y Next.js Proxy/Edge
 */

const SECRET_SEED =
  process.env.WORKSHOP_SECRET ||
  'lince_electromecanica_workshop_secret_2026_key_91823746';

export async function createSessionToken(username: string): Promise<string> {
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_SEED),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(payload)
  );
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${payload}.${signatureHex}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signatureHex] = parts;
  const [username, timestampStr] = payload.split(':');
  if (!username || !timestampStr) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Vigencia máxima de 30 días en la estación local
  const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > MAX_AGE_MS) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_SEED),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(payload)
  );
  const expectedSigHex = Array.from(new Uint8Array(expectedSigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex === expectedSigHex;
}
