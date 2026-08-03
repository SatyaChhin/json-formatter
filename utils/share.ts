// utils/share.ts
// Encodes/decodes editor content into a URL hash fragment so a document can
// be shared via link with no backend. Prefers gzip (native CompressionStream)
// to keep URLs short; falls back to plain base64 on browsers without it.

const GZIP_PREFIX = 'gz.'
const PLAIN_PREFIX = 'b64.'

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

/** Encodes text into a URL-hash-safe token, compressed when the browser supports it. */
export async function encodeShareHash(text: string): Promise<string> {
  if (typeof CompressionStream !== 'undefined') {
    try {
      const compressed = await gzip(text)
      return GZIP_PREFIX + bytesToBase64Url(compressed)
    } catch {
      // fall through to plain encoding
    }
  }
  return PLAIN_PREFIX + bytesToBase64Url(new TextEncoder().encode(text))
}

/** Reverses encodeShareHash; returns null for empty/unrecognized input. */
export async function decodeShareHash(hash: string): Promise<string | null> {
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  if (!value) return null

  if (value.startsWith(GZIP_PREFIX)) {
    const bytes = base64UrlToBytes(value.slice(GZIP_PREFIX.length))
    if (typeof DecompressionStream === 'undefined') return null
    try {
      return await gunzip(bytes)
    } catch {
      return null
    }
  }

  if (value.startsWith(PLAIN_PREFIX)) {
    const bytes = base64UrlToBytes(value.slice(PLAIN_PREFIX.length))
    return new TextDecoder().decode(bytes)
  }

  return null
}
