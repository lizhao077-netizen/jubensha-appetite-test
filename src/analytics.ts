export type AnalyticsEvent =
  | 'page_view'
  | 'test_started'
  | 'answer_selected'
  | 'test_completed'
  | 'result_view'
  | 'share_prompt_shown'
  | 'image_generated'
  | 'image_shared'
  | 'share_card_view';

const visitorKey = 'jubensha-analytics-visitor-v1';
const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT ||
  (window.location.hostname.endsWith('.vercel.app') ? '/api/events' : '');

function visitorId() {
  let id = localStorage.getItem(visitorKey);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(visitorKey, id);
  }
  return id;
}

export function track(event: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  if (!endpoint) return;
  const body = JSON.stringify({ event, payload, visitorId: visitorId(), sentAt: new Date().toISOString() });
  fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit',
  }).catch(() => undefined);
}
