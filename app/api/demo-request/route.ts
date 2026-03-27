import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  "http://localhost:5678/webhook/demo-request";

const TURNSTILE_SECRET_KEY =
  process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

const N8N_API_KEY = process.env.N8N_API_KEY;

// HTML/JS injection karakterlerini temizleme fonksiyonu (XSS koruması için)
const sanitizeInput = (str: string) => {
  return str
    .trim()
    .replace(/[<>"'`]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown-ip";

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

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
      headers: {
        "Content-Type": "application/json",
        ...(N8N_API_KEY && { "Authorization": `Bearer ${N8N_API_KEY}` }),
      },
      body: JSON.stringify({ name: safeName, email, company: safeCompany, phone: safePhone, date: new Date().toISOString() }),
    });

    if (!response.ok) {
      console.error(`n8n webhook hatası: ${response.status}`);
      throw new Error("upstream_error");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("n8n webhook hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
