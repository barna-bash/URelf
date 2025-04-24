export function ensureProtocol(url: string): string {
  // Check if the URL already has a http or https protocol
  const hasProtocol = /^(http:\/\/|https:\/\/)/i.test(url);

  // Add missing http:// or https:// protocol.
  if (!hasProtocol) {
    return `https://${url}`;
  }

  // If it does, return the URL as is
  return url;
}
