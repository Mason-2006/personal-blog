import type { APIRoute } from "astro";

export const prerender = false;

interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface DeepLTranslation {
  detected_source_language: string;
  text: string;
}

interface DeepLResponse {
  translations: DeepLTranslation[];
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.DEEPL_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Translation service not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: TranslateRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { text, sourceLang, targetLang } = body;

  if (!text || !targetLang) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: text, targetLang" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Map language codes to DeepL format
  const deepLSource = sourceLang?.toUpperCase() === "ZH" ? "ZH" : sourceLang?.toUpperCase() || "";
  const deepLTarget = targetLang.toUpperCase() === "ZH" ? "ZH" : targetLang.toUpperCase();

  try {
    const params = new URLSearchParams();
    params.append("text", text);
    if (deepLSource) {
      params.append("source_lang", deepLSource);
    }
    params.append("target_lang", deepLTarget);
    params.append("tag_handling", "html");
    // Preserve MathJax containers and code blocks from translation
    params.append("ignore_tags", "mjx-container,code,pre");

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepL API error: ${response.status} ${errorText}`);
      return new Response(
        JSON.stringify({
          error: "Translation service error",
          status: response.status,
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data: DeepLResponse = await response.json();
    const translatedText = data.translations?.[0]?.text || "";

    return new Response(
      JSON.stringify({ translatedText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Translation proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Internal translation error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
