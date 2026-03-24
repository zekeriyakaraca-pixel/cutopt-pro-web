"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { 
  Menu, X, ArrowRight, Play, Settings, ChevronLeft, ChevronRight,
  Monitor, BarChart, Zap, Laptop, Database, Globe, Check, Camera, Layers
} from "lucide-react";

// --- 1. SHADER ANIMATION (Marka Renklerine Özel) ---
const ShaderAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const vertexShader = `void main() { gl_Position = vec4( position, 1.0 ); }`;
    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mouse;
      void main(void) {
        vec2 m = mouse - 0.5;
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        uv -= m * 0.3; // Farenin hareketine göre ufak bükülme (kayma)
        float t = time * 0.02;
        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 4; i++){
            color[j] += 0.005 / abs(fract(t - 0.02*float(j)+float(i)*0.01)*4.0 - length(uv) + mod(uv.x+uv.y, 0.15));
          }
        }
        color.r *= 1.2; color.b *= 1.5;
        gl_FragColor = vec4(color * 0.8, 1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = { 
      time: { value: 1.0 }, 
      resolution: { value: new THREE.Vector2() },
      mouse: { value: new THREE.Vector2(0.5, 0.5) }
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    container.appendChild(renderer.domElement);

    const onMouseMove = (e: MouseEvent) => {
      uniforms.mouse.value.x = e.clientX / window.innerWidth;
      uniforms.mouse.value.y = 1.0 - (e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMouseMove);

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
      sceneRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(sceneRef.current);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

// --- 2. HATA ÇÖZÜMLÜ CANLI SAYAÇ ---
const AnimatedNumber = ({ value, suffix = "" }: { value: number, suffix?: string }) => {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0); // Saf sayı saklamak için state

  useEffect(() => {
    const controls = animate(count, value, { 
      duration: 2, 
      ease: "easeOut",
      onUpdate: (latest) => {
        // Nesneyi değil, içindeki güncel sayısal değeri state'e yazıyoruz
        setDisplay(Math.round(latest * 10) / 10);
      }
    });
    return controls.stop;
  }, [value, count]);

  return <span>{display}{suffix}</span>;
};

// --- 3. METALİK LOGO ---
const Logo = () => (
  <div className="flex items-center gap-2 group cursor-pointer relative z-50">
    <svg width="180" height="55" viewBox="0 0 250 85" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#1e40af" /></linearGradient>
        <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ea580c" /></linearGradient>
        <linearGradient id="metalicGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f3f4f6" /><stop offset="50%" stopColor="#9ca3af" /><stop offset="100%" stopColor="#d1d5db" /></linearGradient>
      </defs>
      <motion.g animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}><rect x="5" y="25" width="12" height="3" rx="1.5" fill="url(#blueGrad)" opacity="0.6" /><rect x="0" y="33" width="20" height="3" rx="1.5" fill="url(#blueGrad)" opacity="0.9" /><rect x="8" y="41" width="15" height="3" rx="1.5" fill="url(#blueGrad)" opacity="0.4" /></motion.g>
      <text x="40" y="45" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="42" letterSpacing="-1.5"><tspan fill="url(#blueGrad)">Cut</tspan><tspan fill="url(#orangeGrad)">Opt</tspan></text>
      <text x="42" y="72" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="url(#metalicGrad)" fontStyle="italic" letterSpacing="2">PRO</text>
      <rect x="42" y="78" width="140" height="1.5" fill="url(#metalicGrad)" opacity="0.2" />
    </svg>
  </div>
);

const translations = {
  TR: {
    nav1: "Yazılım Gücü", nav2: "Arayüz", demoBtn: "Ücretsiz Demo Al",
    heroBadge: "Yerli Yazılım | Küresel Standart",
    heroTitle1: "Üretim Hattınız İçin", heroTitle2: "Akıllı Optimizasyon.",
    heroDesc: "Alüminyum ve PVC üretiminde firesiz kesim artık hayal değil. Saniyeler içinde binlerce kesim planını hazırlayın ve maliyetleri düşürün.",
    heroCTA1: "Hemen Demo Talep Et",
    stat1: "Hızlı Hesaplama", stat2: "Verim Oranı", stat3: "Yerel Çalışma", stat4: "Entegrasyon",
    featTitle1: "NP-Hard Algoritması", featDesc1: "Matematiksel modelleme ile en karmaşık listeleri saniyeler içinde hatasız çözer.",
    featTitle2: "Maliyet Raporu", featDesc2: "Kullanılan profil miktarını ve fire oranlarını anlık olarak Excel formatında sunar.",
    featTitle3: "Akıllı Stok Yönetimi", featDesc3: "Elinizdeki artık parçaları sisteme kaydedin; yazılım önce bu parçaları kullansın.",
    uiTitle: "Yazılım Arayüzü & Operatör Paneli", uiDesc: "Hız odaklı profesyonel ve modern arayüz tasarımlarımız.",
    ctaTitle: "Maliyetlerinizi Bugün Düşürün", ctaBtn: "Demo Randevusu Al", footer: "Yerel Güç, Akıllı Çözümler.",
    modalTitle: "Demo Talep Formu", namePlaceholder: "Ad Soyad", emailPlaceholder: "E-posta",
    companyPlaceholder: "Şirket Adı", phonePlaceholder: "Telefon (isteğe bağlı)",
    submitBtn: "Gönder", submitting: "Gönderiliyor...",
    successMsg: "Talebiniz alındı! En kısa sürede iletişime geçeceğiz.",
    errorMsg: "Bir hata oluştu. Lütfen tekrar deneyin."
  },
  EN: {
    nav1: "Software", nav2: "Interface", demoBtn: "Free Demo",
    heroBadge: "Local Software | Global Standards",
    heroTitle1: "Smart Optimization For", heroTitle2: "Production Line.",
    heroDesc: "Zero-waste cutting in Aluminum and PVC. Prepare plans in seconds.",
    heroCTA1: "Request Demo",
    stat1: "Fast Calc", stat2: "Efficiency", stat3: "Offline", stat4: "Sync",
    featTitle1: "NP-Hard Algorithm", featDesc1: "Solves complex lists in seconds with advanced math.",
    featTitle2: "Cost Reporting", featDesc2: "Detailed usage and waste rates in Excel format.",
    featTitle3: "Smart Stock", featDesc3: "Re-use scrap pieces automatically in new plans.",
    uiTitle: "Software Interface & Operator Panel", uiDesc: "Our speed-oriented professional and modern interface designs.",
    ctaTitle: "Reduce Costs Today", ctaBtn: "Schedule Demo", footer: "Smart Solutions.",
    modalTitle: "Demo Request Form", namePlaceholder: "Full Name", emailPlaceholder: "Email",
    companyPlaceholder: "Company Name", phonePlaceholder: "Phone (optional)",
    submitBtn: "Submit", submitting: "Sending...",
    successMsg: "Request received! We'll contact you soon.",
    errorMsg: "An error occurred. Please try again."
  },
  DE: {
    nav1: "Software", nav2: "Interface", demoBtn: "Demo",
    heroBadge: "Lokale Software | Globale Standards",
    heroTitle1: "Smarte Optimierung", heroTitle2: "für Ihre Produktion.",
    heroDesc: "Abfallfreies Schneiden von Profilen. Erstellen Sie Pläne in Sekunden.",
    heroCTA1: "Jetzt anfordern",
    stat1: "Schnell", stat2: "Effizienz", stat3: "Offline", stat4: "Export",
    featTitle1: "NP-Hard Algorithmus", featDesc1: "Löst komplexe Listen fehlerfrei in Sekunden.",
    featTitle2: "Kostenberichte", featDesc2: "Detaillierte Profile ve Abfallraten in Excel.",
    featTitle3: "Lagerverwaltung", featDesc3: "Reststücke automatisch nutzen.",
    uiTitle: "Software-Interface & Bedienerpanel", uiDesc: "Unsere geschwindigkeitsorientierten professionellen und modernen Interface-Designs.",
    ctaTitle: "Kosten senken", ctaBtn: "Demo buchen", footer: "Smarte Lösungen.",
    modalTitle: "Demo anfragen", namePlaceholder: "Vollständiger Name", emailPlaceholder: "E-Mail",
    companyPlaceholder: "Firmenname", phonePlaceholder: "Telefon (optional)",
    submitBtn: "Senden", submitting: "Wird gesendet...",
    successMsg: "Anfrage erhalten! Wir melden uns bald.",
    errorMsg: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
  }
};

type Language = "TR" | "EN" | "DE";

export default function FinalLandingPage() {
  const [lang, setLang] = useState<Language>("TR");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const t = translations[lang];

  const openModal = () => { setSubmitStatus("idle"); setForm({ name: "", email: "", company: "", phone: "" }); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-blue-500/30 overflow-x-hidden relative">

      {/* Demo Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#161B2C] border border-white/10 rounded-[28px] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white uppercase italic">{t.modalTitle}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              {submitStatus === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <p className="text-green-400 font-semibold">{t.successMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t.namePlaceholder} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t.emailPlaceholder} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                  <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder={t.companyPlaceholder} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder={t.phonePlaceholder} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                  {submitStatus === "error" && <p className="text-red-400 text-sm">{t.errorMsg}</p>}
                  <button type="submit" disabled={isSubmitting}
                    className="bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                    {isSubmitting ? t.submitting : t.submitBtn} {!isSubmitting && <ArrowRight size={16} />}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soft Top Glow behind everything */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0B0F19]/0 to-transparent pointer-events-none z-[-1]" />

      <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none">
        <ShaderAnimation />
      </div>

      <nav className="fixed top-0 w-full bg-[#0B0F19]/60 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <Logo />
          <div className="hidden md:flex items-center gap-6 font-semibold text-sm">
            <a href="#ozellikler" className="hover:text-white transition-colors">{t.nav1}</a>
            <a href="#arayuz" className="hover:text-white transition-colors">{t.nav2}</a>
            <div className="relative">
                <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                    <Globe size={16} className="text-blue-400" />
                    <span className="text-xs font-bold">{lang}</span>
                </button>
                <AnimatePresence>
                    {isLangOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 right-0 bg-[#161B2C] border border-white/10 rounded-xl overflow-hidden shadow-2xl w-32 z-50">
                            {(Object.keys(translations) as Language[]).map((l) => (
                                <button key={l} onClick={() => { setLang(l); setIsLangOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-blue-600 hover:text-white flex justify-between items-center ${lang === l ? 'text-blue-400' : 'text-slate-400'}`}>
                                    {l === "TR" ? "Türkçe" : l === "EN" ? "English" : "Deutsch"}
                                    {lang === l && <Check size={12} />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button onClick={openModal} className="bg-blue-600 text-white py-2.5 px-6 rounded-full text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 uppercase transition-all">
              {t.demoBtn}
            </button>
          </div>
        </div>
      </nav>

      <section className="relative pt-48 pb-32 px-6 text-center max-w-5xl mx-auto">
        <motion.div key={lang} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold uppercase mb-8 border border-blue-500/20">
            <Laptop size={16} /> {t.heroBadge}
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1] mb-8 uppercase italic filter drop-shadow-lg">
            {t.heroTitle1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-orange-500">{t.heroTitle2}</span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">{t.heroDesc}</p>
          <button onClick={openModal} className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-500 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105 hover:shadow-blue-500/40 border border-blue-400/20">
            {t.heroCTA1} <ArrowRight size={20}/>
          </button>
        </motion.div>
      </section>

      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
        className="px-6 mb-32"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-white/5 pt-12">
             <Stat value={1.5} suffix="s" label={t.stat1} />
             <Stat value={98.4} suffix="%" label={t.stat2} />
             <Stat isText value="OFFLINE" label={t.stat3} />
             <Stat isText value="EXCEL" label={t.stat4} />
        </div>
      </motion.section>

      {/* YAZILIM EKRAN GÖRÜNTÜLERİ BÖLÜMÜ (Yeni) */}
      <section id="arayuz" className="py-24 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase italic tracking-tight">{t.uiTitle}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{t.uiDesc}</p>
          </div>
          <div className="max-w-[1200px] mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
               className="rounded-[32px] overflow-hidden bg-white/[0.02] border border-white/5 p-3 md:p-6 transition-all duration-500 hover:border-blue-500/40 hover:glow-lg shadow-2xl relative group"
            >
              <ImageCarousel images={["/arayuz1.png", "/arayuz2.png", "/arayuz3.png", "/arayuz4.png", "/arayuz5.png"]} />
              
              <div className="mt-8 text-center px-4 pb-4">
                <h4 className="font-black text-2xl md:text-3xl uppercase italic mb-3 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400 drop-shadow-lg">Üstün Yazılım Mimarisi</h4>
                <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">Tüm üretim ihtiyaçlarınızı tek ekrandan, karmaşaya yer bırakmadan yönetin. Yüksek detaylı stok takibi, fire oranları ve görsel kesim haritaları parmaklarınızın ucunda.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="ozellikler" className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-3 gap-8 overflow-hidden">
          <FeatureItem icon={<Zap/>} title={t.featTitle1} desc={t.featDesc1} delay={0.1} />
          <FeatureItem icon={<BarChart/>} title={t.featTitle2} desc={t.featDesc2} delay={0.3} />
          <FeatureItem icon={<Database className="text-blue-400"/>} title={t.featTitle3} desc={t.featDesc3} delay={0.5} />
      </section>

      <motion.section 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
        className="py-32 px-6 text-center"
      >
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-900 rounded-[40px] p-16 md:p-24 shadow-[0_0_80px_rgba(79,70,229,0.2)] relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 p-10 opacity-10"><Settings size={200} className="animate-spin-slow text-white" /></div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-10 relative z-10 italic uppercase tracking-tight filter drop-shadow-md">{t.ctaTitle}</h2>
            <button onClick={openModal} className="bg-white text-blue-700 px-12 py-5 rounded-full font-bold text-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all relative z-10 hover:scale-105 hover:bg-slate-50">{t.ctaBtn}</button>
        </div>
      </motion.section>

      <footer className="py-12 text-center text-slate-600 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.2em]">
        © 2026 CutOpt Pro Software - {t.footer}
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, desc, delay = 0 }: { icon: React.ReactElement, title: string, desc: string, delay?: number }) {
    return (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay }}
          className="p-10 rounded-[32px] bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/40 transition-all duration-500 group relative overflow-hidden hover:glow-md"
        >
            <div className="text-blue-500 mb-6 group-hover:scale-110 group-hover:text-blue-400 transition-all duration-500">{React.cloneElement(icon as React.ReactElement<any>, { size: 40 })}</div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight uppercase italic">{title}</h3>
            <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
            <div className="absolute -inset-x-10 -inset-y-10 bg-gradient-to-r from-blue-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700 pointer-events-none" />
        </motion.div>
    );
}

function Stat({ value, label, suffix = "", isText = false }: { value: any, label: string, suffix?: string, isText?: boolean }) {
    return (
        <div>
            <div className="text-4xl font-black text-white mb-1 tracking-tighter italic">{isText ? value : <AnimatedNumber value={value} suffix={suffix} />}</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        </div>
    );
}

function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-slate-900 border border-white/5 group">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          onError={(e) => {
             // Fallback to random pattern or placeholder if image not uploaded yet
             (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1551288049-bbdaef866d75?q=80&w=1200&sig=${currentIndex}`;
          }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-40 pointer-events-none" />
      
      {/* Navigation Buttons */}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-xl z-20">
         <ChevronLeft size={24} />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-xl z-20">
         <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, i) => (
          <button 
             key={i} 
             onClick={() => setCurrentIndex(i)} 
             className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? "bg-blue-500 w-8 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-white/40 w-2 hover:bg-white"}`} 
             aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}