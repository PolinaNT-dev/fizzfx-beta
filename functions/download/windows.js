export async function onRequest(context) {
  const url = context.env.FIZZFX_WINDOWS_INSTALLER_URL;
  if (!url) {
    return new Response("FizzFX Windows installer URL is not configured yet.", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }
  return Response.redirect(url, 302);
}
