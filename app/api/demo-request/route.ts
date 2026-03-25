import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  "http://localhost:5678/webhook/demo-request";

const TURNSTILE_SECRET_KEY =
  process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

// Basit bir HTML etiket temizleme fonksiyonu (XSS koruması için)
const sanitizeInput = (str: string) => {
  return str.replace(/[<>]/g, ""); // < ve > karakterlerini siler
};

// Basit bir In-Memory Hız Sınırlandırıcı (Rate Limiter)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX_REQUESTS = 3; // 1 dakikada en fazla 3 istek
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 dakika

export async function POST(req: NextRequest) {
  // IP adresini al (Bulut servislerde req.ip, normal sunucularda x-forwarded-for kullanılır)
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown-ip";
  const currentTime = Date.now();

  // Rate limit kontrolü
  const rateLimitInfo = rateLimitMap.get(ip) || { count: 0, lastReset: currentTime };

  if (currentTime - rateLimitInfo.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitInfo.count = 0;
    rateLimitInfo.lastReset = currentTime;
  }

  if (rateLimitInfo.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json({ error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  rateLimitInfo.count += 1;
  rateLimitMap.set(ip, rateLimitInfo);

  const body = await req.json();
  const { name, email, company, phone, token } = body;

  if (!token) {
    return NextResponse.json({ error: "Lütfen robot olmadığınızı doğrulayın." }, { status: 400 });
  }

  // Basic Validation
  if (!name || !email || !company) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  // Turnstile Token Doğrulama
  const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${TURNSTILE_SECRET_KEY}&response=${token}&remoteip=${ip}`,
  });
  const turnstileData = await turnstileRes.json();
  if (!turnstileData.success) {
    return NextResponse.json({ error: "Güvenlik doğrulaması (CAPTCHA) başarısız oldu." }, { status: 400 });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Geçersiz e-posta formatı" }, { status: 400 });
  }

  // Length constraints
  if (name.length > 100 || email.length > 100 || company.length > 100 || (phone && phone.length > 50)) {
    return NextResponse.json({ error: "Çok uzun veri girişi" }, { status: 400 });
  }

  // Verileri temizle (Sanitize)
  const safeName = sanitizeInput(name);
  const safeCompany = sanitizeInput(company);
  const safePhone = phone ? sanitizeInput(phone) : "";

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: safeName, email, company: safeCompany, phone: safePhone, date: new Date().toISOString() }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook hatası: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("n8n webhook hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
