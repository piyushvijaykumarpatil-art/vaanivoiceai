const rawBase = (import.meta as any).env?.VITE_API_BASE || '/api';
export const API_BASE = rawBase === '/api' 
  ? '/api' 
  : (rawBase.replace(/\/+$/, '').endsWith('/api') ? rawBase.replace(/\/+$/, '') : `${rawBase.replace(/\/+$/, '')}/api`);

export async function sendChatMessage(payload: {
  sessionId: string;
  message: string;
  image?: string;
  language: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  geminiApiKey?: string;
}) {
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('vaani_gemini_api_key') : null;
  const fullPayload = {
    ...payload,
    geminiApiKey: payload.geminiApiKey || storedKey || undefined
  };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (storedKey) {
    headers['x-gemini-api-key'] = storedKey;
  }
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fullPayload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to send message');
  }
  return res.json();
}

export async function fetchTtsAudio(payload: {
  text: string;
  language: string;
  voice?: string;
  rate?: string;
  pitch?: string;
}): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('TTS voice synthesis failed');
  }
  return res.arrayBuffer();
}

export async function getCalendarContext() {
  const res = await fetch(`${API_BASE}/calendar`);
  if (!res.ok) throw new Error('Failed to fetch calendar');
  return res.json();
}

export async function getSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function deleteSession(id: string) {
  const res = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete session');
  return res.json();
}

export async function testSupabase(url: string, key: string) {
  const res = await fetch(`${API_BASE}/sync/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, key })
  });
  return res.json();
}

export async function syncToSupabase(url: string, key: string) {
  const res = await fetch(`${API_BASE}/sync/supabase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, key })
  });
  return res.json();
}

export async function getSqlSchema(): Promise<string> {
  const res = await fetch(`${API_BASE}/sync/schema`);
  return res.text();
}

export async function restoreDatabase(jsonPayload: any) {
  const res = await fetch(`${API_BASE}/sync/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonPayload)
  });
  return res.json();
}

export async function sendFeedback(payload: {
  rating: number;
  category: string;
  comments: string;
  userName: string;
}) {
  const res = await fetch(`${API_BASE}/feedbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
