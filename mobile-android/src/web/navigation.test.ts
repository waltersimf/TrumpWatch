import { describe, expect, it } from 'vitest';
import { classifyWebNavigation } from './navigation';

const CANONICAL_URL = 'https://trumpdash-njn2ba2j.manus.space/';

describe('WebView navigation policy', () => {
  it('keeps canonical web routes and API requests inside the WebView', () => {
    expect(classifyWebNavigation(CANONICAL_URL, CANONICAL_URL)).toBe('allow');
    expect(
      classifyWebNavigation(
        'https://trumpdash-njn2ba2j.manus.space/api/trpc/dashboard.getDashboardData',
        CANONICAL_URL
      )
    ).toBe('allow');
    expect(classifyWebNavigation('about:blank', CANONICAL_URL)).toBe('allow');
  });

  it('opens ordinary external and Android app links outside the WebView', () => {
    expect(classifyWebNavigation('https://www.reuters.com/world/us/', CANONICAL_URL)).toBe(
      'external'
    );
    expect(classifyWebNavigation('mailto:news@example.org', CANONICAL_URL)).toBe('external');
    expect(classifyWebNavigation('tel:+12025550123', CANONICAL_URL)).toBe('external');
  });

  it('rejects malformed and unsupported scheme URLs', () => {
    expect(classifyWebNavigation('not a url', CANONICAL_URL)).toBe('reject');
    expect(classifyWebNavigation('javascript:alert(1)', CANONICAL_URL)).toBe('reject');
    expect(classifyWebNavigation('file:///data/local/tmp/test.html', CANONICAL_URL)).toBe(
      'reject'
    );
  });
});
