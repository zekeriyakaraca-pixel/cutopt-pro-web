"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import {
  ArrowRight, Settings,
  BarChart, Zap, Laptop, Database, Globe, Check
} from "lucide-react";
import { translations, type Language } from "@/lib/translations";
import DemoModal from "@/components/DemoModal";
import ImageCarousel from "@/components/ImageCarousel";

// --- 1. SHADER ANIMATION ---
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
        uv -= m * 0.3;
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

// --- 2. ANIMATED NUMBER ---
const AnimatedNumber = ({ value, suffix = "" }: { value: number, suffix?: string }) => {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplay(Math.round(latest * 10) / 10);
      }
    });
    return controls.stop;
  }, [value, count]);

  return <span>{display}{suffix}</span>;
};

// --- 3. LOGO ---
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

export default function FinalLandingPage() {
  const [lang, setLang] = useState<Language>("TR");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = translations[lang];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CutOpt PRO",
    "operatingSystem": "Windows",
    "applicationCategory": "BusinessApplication",
    "description": "Alüminyum ve PVC üretiminde firesiz kesim optimizasyon yazılımı.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "TRY"
    }
  };

  return (
    <div className="min-h-screen selection:bg-blue-500/30 overflow-x-hidden relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} t={t} />

      {/* Soft Top Glow */}
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
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white py-2.5 px-6 rounded-full text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 uppercase transition-all">
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
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-500 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105 hover:shadow-blue-500/40 border border-blue-400/20">
            {t.heroCTA1} <ArrowRight size={20} />
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
              <ImageCarousel images={[
                { src: "/arayuz1.png", alt: "CutOpt PRO Ana Ekran" },
                { src: "/arayuz2.png", alt: "Kesim Listesi Yönetimi" },
                { src: "/arayuz3.png", alt: "Optimizasyon Sonuçları" },
                { src: "/arayuz4.png", alt: "Fire Raporlama" },
                { src: "/arayuz5.png", alt: "Stok Takibi" }
              ]} />

              <div className="mt-8 text-center px-4 pb-4">
                <h3 className="font-black text-2xl md:text-3xl uppercase italic mb-3 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400 drop-shadow-lg">Üstün Yazılım Mimarisi</h3>
                <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">Tüm üretim ihtiyaçlarınızı tek ekrandan, karmaşaya yer bırakmadan yönetin. Yüksek detaylı stok takibi, fire oranları ve görsel kesim haritaları parmaklarınızın ucunda.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="ozellikler" className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-3 gap-8 overflow-hidden">
        <FeatureItem icon={<Zap />} title={t.featTitle1} desc={t.featDesc1} delay={0.1} />
        <FeatureItem icon={<BarChart />} title={t.featTitle2} desc={t.featDesc2} delay={0.3} />
        <FeatureItem icon={<Database className="text-blue-400" />} title={t.featTitle3} desc={t.featDesc3} delay={0.5} />
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
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-blue-700 px-12 py-5 rounded-full font-bold text-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all relative z-10 hover:scale-105 hover:bg-slate-50">{t.ctaBtn}</button>
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
      <div className="text-blue-500 mb-6 group-hover:scale-110 group-hover:text-blue-400 transition-all duration-500">{React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 40 })}</div>
      <h3 className="text-2xl font-bold text-white mb-4 tracking-tight uppercase italic">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
      <div className="absolute -inset-x-10 -inset-y-10 bg-gradient-to-r from-blue-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
}

function Stat({ value, label, suffix = "", isText = false }: { value: string | number, label: string, suffix?: string, isText?: boolean }) {
  return (
    <div>
      <div className="text-4xl font-black text-white mb-1 tracking-tighter italic">
        {isText ? value : <AnimatedNumber value={value as number} suffix={suffix} />}
      </div>
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}
