export async function onRequest(context) {
  const country = context.request.cf?.country;

  if (country === "RU") {
    return new Response("Access denied", {
      status: 403,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  return context.next();
}
