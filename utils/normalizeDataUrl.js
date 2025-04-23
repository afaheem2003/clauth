// utils/normalizeDataUrl.js

export function normalizeDataUrl(dataUrl) {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const [meta, payload] = dataUrl.split(',');
  // convert URL‑safe base64 ('-' and '_') back to standard base64 ('+' and '/')
  const fixed = payload.replace(/-/g, '+').replace(/_/g, '/');
  return `${meta},${fixed}`;
}
