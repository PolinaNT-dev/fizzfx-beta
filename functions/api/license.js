export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = bearerToken(request);
  if (!token) return json({ active: false, error: "Missing bearer token." }, 401);

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return json({ active: false, error: "Auth is not configured." }, 503);
  }

  const user = await verifyUser(env, token);
  if (!user) return json({ active: false, error: "Invalid session." }, 401);

  const table = env.SUPABASE_LICENSE_TABLE || "";
  if (!table) {
    return json({
      active: true,
      mode: "auth-only",
      user: publicUser(user)
    });
  }

  const license = await findLicense(env, table, user);
  const status = String(license?.status || "").toLowerCase();
  const expiresAt = license?.expires_at ? Date.parse(license.expires_at) : null;
  const active = ["active", "trial", "beta"].includes(status) && (!expiresAt || expiresAt > Date.now());

  return json({
    active,
    mode: "license-table",
    status: status || "missing",
    expiresAt: license?.expires_at || null,
    user: publicUser(user)
  }, active ? 200 : 403);
}

function bearerToken(request) {
  const value = request.headers.get("authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

async function verifyUser(env, token) {
  try {
    const res = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
      headers: {
        "apikey": env.SUPABASE_ANON_KEY,
        "authorization": "Bearer " + token
      }
    });
    return res.ok ? await res.json() : null;
  } catch (_err) {
    return null;
  }
}

async function findLicense(env, table, user) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  const base = env.SUPABASE_URL + "/rest/v1/" + encodeURIComponent(table);
  const headers = {
    "apikey": key,
    "authorization": "Bearer " + key,
    "accept": "application/json"
  };
  const queries = [
    "select=status,expires_at,user_id,email&user_id=eq." + encodeURIComponent(user.id),
    user.email ? "select=status,expires_at,user_id,email&email=eq." + encodeURIComponent(user.email) : ""
  ].filter(Boolean);

  for (const query of queries) {
    try {
      const res = await fetch(base + "?" + query + "&limit=1", { headers });
      if (!res.ok) continue;
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]) return rows[0];
    } catch (_err) {}
  }
  return null;
}

function publicUser(user) {
  return {
    id: user.id || "",
    email: user.email || ""
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "authorization, content-type"
  };
}
