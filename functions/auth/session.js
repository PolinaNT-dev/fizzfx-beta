export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return json({ error: "Auth is not configured." }, 503);
  }

  let body = {};
  try {
    body = await request.json();
  } catch (_err) {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const token = String(body.access_token || "");
  const refreshToken = String(body.refresh_token || "");
  const expiresIn = Math.max(60, Math.min(Number(body.expires_in) || 3600, 3600));
  if (!token) return json({ error: "Missing access token." }, 400);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      "apikey": env.SUPABASE_ANON_KEY,
      "authorization": `Bearer ${token}`
    }
  });

  if (!userRes.ok) return json({ error: "Invalid session." }, 401);

  const user = await userRes.json();
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  headers.append(
    "set-cookie",
    `fizzfx_session=${encodeURIComponent(token)}; Path=/; Max-Age=${Math.floor(expiresIn)}; HttpOnly; Secure; SameSite=Lax`
  );
  if (refreshToken) {
    headers.append(
      "set-cookie",
      `fizzfx_refresh=${encodeURIComponent(refreshToken)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
    );
  }

  return new Response(JSON.stringify({ ok: true, email: user.email || "" }), {
    status: 200,
    headers
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
