type JsonRecord = Record<string, unknown>;

function detailToString(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim() !== "") {
    return detail.trim();
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first === "object" && "msg" in first) {
      const msg = (first as { msg?: unknown }).msg;
      return typeof msg === "string" ? msg : null;
    }
  }
  return null;
}

/** Разбор тела ошибки FastAPI / TableCRM и наших BFF `{ message }`. */
export function pickHttpErrorText(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const o = body as JsonRecord;

  const fromDetail = detailToString(o.detail);
  if (fromDetail) {
    return fromDetail;
  }

  const msg = o.message;
  if (typeof msg === "string" && msg.trim() !== "") {
    const trimmed = msg.trim();
    if (trimmed.startsWith("{")) {
      try {
        const inner = JSON.parse(trimmed) as JsonRecord;
        const nested = pickHttpErrorText(inner);
        if (nested) {
          return nested;
        }
      } catch {
        /* не JSON */
      }
    }
    return trimmed;
  }

  return null;
}

export function errorTextFromFetchJsonPayload(text: string): string {
  const raw = text.trim();
  if (!raw) {
    return "";
  }
  try {
    const j = JSON.parse(raw) as unknown;
    return pickHttpErrorText(j) ?? raw;
  } catch {
    return raw;
  }
}
