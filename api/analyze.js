export const config = { runtime: "edge" };

export default async function handler(req) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...headers, "Content-Type": "application/json" }
    });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Authorization header required" }), {
      status: 401, headers: { ...headers, "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const catoRes = await fetch("https://api.aisec.catonetworks.com/fw/v1/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await catoRes.text();
    return new Response(data, {
      status: catoRes.status,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Cato API connection failed", detail: err.message }), {
      status: 502, headers: { ...headers, "Content-Type": "application/json" }
    });
  }
}
