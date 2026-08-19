export type WebNavigationAction = 'allow' | 'external' | 'reject';

const EXTERNAL_APP_PROTOCOLS = new Set(['mailto:', 'tel:', 'sms:', 'geo:']);

export function classifyWebNavigation(
  requestedUrl: string,
  canonicalUrl: string
): WebNavigationAction {
  if (requestedUrl === 'about:blank') return 'allow';

  try {
    const requested = new URL(requestedUrl);
    const canonical = new URL(canonicalUrl);

    if (requested.protocol === 'http:' || requested.protocol === 'https:') {
      return requested.origin === canonical.origin ? 'allow' : 'external';
    }

    return EXTERNAL_APP_PROTOCOLS.has(requested.protocol) ? 'external' : 'reject';
  } catch {
    return 'reject';
  }
}
