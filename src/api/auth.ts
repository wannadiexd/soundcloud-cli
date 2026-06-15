const AUTH_BASE = "/sc-auth";

export async function startLogin(): Promise<{ url: string; loginRequestId: string }> {
  const res = await fetch(`${AUTH_BASE}/auth/login`);
  if (!res.ok) throw new Error("Failed to start login");
  return res.json();
}

export async function pollLoginStatus(loginRequestId: string): Promise<{
  status: "pending" | "completed" | "failed" | "expired";
  step?: string;
  sessionId?: string;
  username?: string;
  error?: string;
}> {
  const res = await fetch(
    `${AUTH_BASE}/auth/login/status?id=${encodeURIComponent(loginRequestId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Poll failed");
  return res.json();
}

export async function fetchMe(sessionId: string): Promise<{
  id: number;
  username: string;
  avatar_url: string;
}> {
  const token = sessionId.startsWith("OAuth") ? sessionId : `OAuth ${sessionId}`;
  const res = await fetch(`/sc-api/me`, {
    headers: {
      Authorization: token,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}