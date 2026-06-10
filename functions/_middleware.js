export async function onRequest(context) {
  const { request, env } = context;
  const country = request.cf?.country;

  if (country === "RU") {
    return new Response("Access denied", {
      status: 403,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  const url = new URL(request.url);
  if (isPublicPath(url.pathname)) return context.next();

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response("FizzFX auth is not configured.", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  const token = getCookie(request, "fizzfx_session");
  if (token && await verifySupabaseSession(env, token)) {
    return context.next();
  }

  const refreshToken = getCookie(request, "fizzfx_refresh");
  if (refreshToken) {
    const refreshed = await refreshSupabaseSession(env, refreshToken);
    if (refreshed?.access_token) {
      const response = await context.next();
      appendSessionCookies(response.headers, refreshed);
      return response;
    }
  }

  const next = encodeURIComponent(url.pathname + url.search);
  return Response.redirect(`${url.origin}/login.html?next=${next}`, 302);
}

function isPublicPath(pathname) {
  return pathname === "/login" ||
    pathname === "/login.html" ||
    pathname === "/download" ||
    pathname === "/download.html" ||
    pathname.startsWith("/download/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/");
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const found = cookie
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

async function verifySupabaseSession(env, token) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": env.SUPABASE_ANON_KEY,
        "authorization": `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (_err) {
    return false;
  }
}

async function refreshSupabaseSession(env, refreshToken) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "apikey": env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    return res.ok ? await res.json() : null;
  } catch (_err) {
    return null;
  }
}

function appendSessionCookies(headers, session) {
  const accessAge = Math.max(60, Math.min(Number(session.expires_in) || 3600, 3600));
  headers.append(
    "set-cookie",
    `fizzfx_session=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${Math.floor(accessAge)}; HttpOnly; Secure; SameSite=Lax`
  );

  if (session.refresh_token) {
    headers.append(
      "set-cookie",
      `fizzfx_refresh=${encodeURIComponent(session.refresh_token)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
    );
  }
}
