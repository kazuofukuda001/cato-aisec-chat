export const config = { runtime: "edge" };

export default async function handler(req) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Anthropic-Key",
  };
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const catoKey = req.headers.get("authorization");
  const anthropicKey = req.headers.get("x-anthropic-key");
  if (!catoKey) return json({ error: "Authorization (Cato Guard Key) required" }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const { messages, system_prompt } = body;

  // 1. Cato AISec でリクエストを分析
  let catoResult = null;
  try {
    const catoRes = await fetch("https://api.aisec.catonetworks.com/fw/v1/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": catoKey },
      body: JSON.stringify({ messages }),
    });
    catoResult = await catoRes.json();
  } catch (e) {
    catoResult = { _cato_error: e.message };
  }

  // Catoがブロック判定 → LLMに送らず返す
  const blocked = catoResult?.blocked === true || catoResult?.action === "block";
  if (blocked) {
    return json({ cato: catoResult, llm: null, blocked: true });
  }

  // 2. Anthropic Claude でLLMレスポンスを生成
  let llmResult = null;
  if (anthropicKey) {
    try {
      const systemMsg = system_prompt || "あなたは安全で有益なAIアシスタントです。日本語で回答してください。";
      const llmRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemMsg,
          messages,
        }),
      });
      llmResult = await llmRes.json();
    } catch (e) {
      llmResult = { _llm_error: e.message };
    }
  }

  return json({ cato: catoResult, llm: llmResult, blocked: false });
}
