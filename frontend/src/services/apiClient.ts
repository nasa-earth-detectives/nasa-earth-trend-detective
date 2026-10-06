const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function getJson<T>(endpoint: string, params?: Record<string, string | number>,
  init?: { signal?: AbortSignal }): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    signal: init?.signal,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
