import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

const N8N_API_KEY = process.env.N8N_API_KEY;

// Yalnızca metin alanı için güvenli encoding (karakter silmek yerine encode et)
const encodeField = (str: string): string => str.trim();

// Email format + temel domain kontrolü
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  // x-forwarded-for ilk IP'yi al (proxy zincirine karşı güvenli)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Geçersiz istek formatı." }, { status: 400 });
  }

  const { name, email, company, phone, token } = body as Record<string, unknown>;

  // Tip kontrolü
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof company !== "string" ||
    typeof token !== "string" ||
    (phone !== undefined && typeof phone !== "string")
  ) {
    return NextResponse.json({ error: "Geçersiz alan tipleri." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "Lütfen robot olmadığınızı doğrulayın." }, { status: 400 });
  }

  if (!name.trim() || !email.trim() || !company.trim()) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  // Length constraints
  if (
    name.length > 100 ||
    email.length > 100 ||
    company.length > 100 ||
    (phone && phone.length > 50)
  ) {
    return NextResponse.json({ error: "Çok uzun veri girişi" }, { status: 400 });
  }

  // Email format validation
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Geçersiz e-posta formatı" }, { status: 400 });
  }

  const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

  if (!TURNSTILE_SECRET_KEY || !N8N_WEBHOOK_URL) {
    console.error("Eksik ortam değişkeni: TURNSTILE_SECRET_KEY veya N8N_WEBHOOK_URL tanımlanmamış.");
    return NextResponse.json({ error: "Sunucu yapılandırma hatası." }, { status: 500 });
  }

  // Turnstile Token Doğrulama (5s timeout)
  try {
    const turnstileController = new AbortController();
    const turnstileTimeout = setTimeout(() => turnstileController.abort(), 5000);
    const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${TURNSTILE_SECRET_KEY}&response=${token}&remoteip=${ip}`,
      signal: turnstileController.signal,
    });
    clearTimeout(turnstileTimeout);
    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      return NextResponse.json({ error: "Güvenlik doğrulaması (CAPTCHA) başarısız oldu." }, { status: 400 });
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error("Turnstile doğrulama hatası:", isTimeout ? "Zaman aşımı" : "Bağlantı hatası");
    return NextResponse.json({ error: "CAPTCHA doğrulaması sırasında hata oluştu." }, { status: 503 });
  }

  const safeName = encodeField(name);
  const safeCompany = encodeField(company);
  const safePhone = phone ? encodeField(phone) : "";

  // n8n Webhook (10s timeout)
  try {
    const webhookController = new AbortController();
    const webhookTimeout = setTimeout(() => webhookController.abort(), 10000);
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_API_KEY && { Authorization: `Bearer ${N8N_API_KEY}` }),
      },
      body: JSON.stringify({
        name: safeName,
        email,
        company: safeCompany,
        phone: safePhone,
        date: new Date().toISOString(),
      }),
      signal: webhookController.signal,
    });
    clearTimeout(webhookTimeout);

    if (!response.ok) {
      console.error(`n8n webhook hatası: ${response.status}`);
      throw new Error("upstream_error");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error("n8n webhook hatası:", isTimeout ? "Zaman aşımı" : err instanceof Error ? err.message : "Bilinmeyen hata");
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
