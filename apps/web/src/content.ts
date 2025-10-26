import api from './api';

export interface InfoSection { title: string; content: string[] }
export interface InfoPayload { sections: Record<string, InfoSection> }

export async function getServerContent(locale: string): Promise<InfoPayload | null> {
  try {
    const { data } = await api.get(`/api/content/${locale}`);
    if (data?.ok && data?.data) return data.data as InfoPayload;
    return null;
  } catch {
    return null;
  }
}

export async function saveServerContent(locale: string, payload: InfoPayload): Promise<boolean> {
  try {
    const { data } = await api.put(`/api/content/${locale}`, payload);
    return !!data?.ok;
  } catch {
    return false;
  }
}

export async function patchServerContent(locale: string, partial: Partial<InfoPayload>): Promise<boolean> {
  try {
    const { data } = await api.patch(`/api/content/${locale}`, partial);
    return !!data?.ok;
  } catch {
    return false;
  }
}

export async function translateText(q: string, source: string, target: string): Promise<string | null> {
  try {
    const { data } = await api.post(`/api/content/translate`, { q, source, target, format: 'text' });
    const t = data?.data?.translatedText;
    return typeof t === 'string' ? t : null;
  } catch {
    return null;
  }
}

export async function translateBulk(paragraphs: string[], source: string, target: string): Promise<string[]> {
  const out: string[] = [];
  for (const p of paragraphs) {
    const t = await translateText(p, source, target);
    out.push(t ?? p);
  }
  return out;
}
