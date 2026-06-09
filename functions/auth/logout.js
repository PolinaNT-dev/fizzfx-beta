export async function onRequest(context) {
  const url = new URL(context.request.url);
  const headers = new Headers({
    "location": `${url.origin}/login.html`
  });

  headers.append(
    "set-cookie",
    "fizzfx_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
  );
  headers.append(
    "set-cookie",
    "fizzfx_refresh=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
  );

  return new Response(null, {
    status: 302,
    headers
  });
}
