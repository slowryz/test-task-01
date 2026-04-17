export function getBearerTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  const token = (m?.[1]?.trim()) ?? "";
  return token.length > 0 ? token : null;
}
