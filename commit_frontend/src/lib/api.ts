import type { LanguageId } from "./encoding";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    // Try to pull FastAPI's {"detail": "..."} out of the response so
    // callers can show the real error, not just a status code.
    let detail = `Request to ${path} failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // Response wasn't JSON — keep the generic message above.
    }
    throw new Error(detail);
  }
  return res.json();
}

export function createConfession(message: string, language: LanguageId) {
  return request<{ id: string }>("/confessions", {
    method: "POST",
    body: JSON.stringify({ message, language }),
  });
}

export function sendConfession(id: string, recipientPhone: string, notifyPhone?: string) {
  const body: { recipient_phone: string; notify_phone?: string } = {
    recipient_phone: recipientPhone,
  };
  // Omitted entirely when the sender left the box empty (the backend treats
  // a missing value as "don't text me").
  const notify = notifyPhone?.trim();
  if (notify) body.notify_phone = notify;

  return request<{ status: string }>(`/confessions/${id}/send`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchConfession(id: string) {
  return request<{ message: string; language: LanguageId }>(`/confessions/${id}`);
}

export function respondToConfession(id: string, response: string) {
  return request<{ status: string; response: string | null }>(`/confessions/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ response }),
  });
}

export function markRead(id: string) {
  return request<{ ok: boolean }>(`/confessions/${id}/read`, { method: "POST" });
}

export function fetchStatus(id: string) {
  return request<{
    status: string;
    message: string | null;
    sent_at: string | null;
    response: string | null;
    responded_at: string | null;
    read_at: string | null;
  }>(`/confessions/${id}/status`);
}
