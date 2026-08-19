import Constants from 'expo-constants';

const DEFAULT_PRODUCTION_URL = 'https://trumpdash-njn2ba2j.manus.space';

function normalizeBaseUrl(value: string | undefined): string {
  const candidate = value?.trim() || DEFAULT_PRODUCTION_URL;
  return candidate.replace(/\/+$/, '');
}

export const PRODUCTION_BASE_URL = normalizeBaseUrl(
  Constants.expoConfig?.extra?.dashboardApiBaseUrl as string | undefined
);

export const PRODUCTION_WEB_URL = `${PRODUCTION_BASE_URL}/`;
