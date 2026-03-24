import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  "http://localhost:5678/webhook/demo-request";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, company, phone } = body;

  if (!name || !email || !company) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, company, phone, date: new Date().toISOString() }),
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
