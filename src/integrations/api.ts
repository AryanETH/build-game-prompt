const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const isApiMode = () => typeof API_BASE === 'string' && API_BASE.length > 0;

async function request(path: string, init?: RequestInit) {
  if (!isApiMode()) throw new Error('API mode disabled');
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

export async function apiUpload(file: File, kind: 'avatar' | 'audio'): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  const data = await request('/upload', { method: 'POST', body: form });
  return (data.url as string) || '';
}

export async function apiCreateGame(payload: Record<string, any>) {
  return request('/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function apiGetGames(): Promise<any[]> {
  return request('/games', { method: 'GET' });
}

export async function apiGetMyProfile(): Promise<any> {
  return request('/profiles/me', { method: 'GET' });
}

export async function apiUpdateMyProfile(patch: Record<string, any>) {
  return request('/profiles/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
}

export async function apiGetMyGames(): Promise<any[]> {
  return request('/me/games', { method: 'GET' });
}

export async function apiPostComment(gameId: string, content: string) {
  return request(`/games/${gameId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
}

export async function apiGetComments(gameId: string): Promise<any[]> {
  return request(`/games/${gameId}/comments`, { method: 'GET' });
}

export async function apiSearchGames(query: string): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('q', query);
  return request(`/games/search?${params.toString()}`, { method: 'GET' });
}

export async function apiToggleLike(gameId: string, action: 'like' | 'unlike') {
  return request(`/games/${gameId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}

export async function apiGenerateGame(prompt: string, options?: Record<string, any>): Promise<{ gameCode: string }> {
  return request('/generate-game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, options }),
  });
}

export async function apiGenerateThumbnail(prompt: string): Promise<{ thumbnailUrl: string }> {
  return request('/generate-thumbnail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
}
