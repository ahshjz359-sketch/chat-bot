// api/chat.js
const SYSTEM_PROMPT =
  "إنت مساعد ذكي وودود بترد على زوار الموقع باللغة العربية بشكل واضح ومختصر ومفيد.";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "الطريقة دي مش مدعومة، استخدم POST." });
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY مش موجود. ضيفه في إعدادات Environment Variables بتاعة Vercel.",
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "لازم تبعت مصفوفة messages مش فاضية." });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "حصل خطأ من طرف Anthropic API.",
      });
    }

    const textBlock = data.content?.find((c) => c.type === "text");
    return res.status(200).json({ reply: textBlock ? textBlock.text : "" });
  } catch (err) {
    console.error("Function error:", err);
    return res.status(500).json({ error: "حصل خطأ في السيرفر." });
  }
};
