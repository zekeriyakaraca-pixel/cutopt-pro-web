"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRight } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { Translations } from "@/lib/translations";

type FormFields = "name" | "email" | "company" | "phone";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d\s\-()\u00C0-\u024F]{7,20}$/;

export default function DemoModal({
  isOpen,
  onClose,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
}) {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", company: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSubmitStatus("idle");
      setSubmitError("");
      setForm({ name: "", email: "", company: "", phone: "" });
      setFieldErrors({ name: "", email: "", company: "", phone: "" });
      setTurnstileToken("");
    }
  }, [isOpen]);

  const validateField = (field: FormFields, value: string): string => {
    if (field === "name" || field === "company") {
      return value.trim() ? "" : t.fieldRequired;
    }
    if (field === "email") {
      if (!value.trim()) return t.fieldRequired;
      return EMAIL_REGEX.test(value) ? "" : t.emailInvalid;
    }
    if (field === "phone") {
      return value && !PHONE_REGEX.test(value) ? t.phoneInvalid : "";
    }
    return "";
  };

  const handleChange = (field: FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: FormFields) => {
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const validateAll = (): boolean => {
    const errors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      company: validateField("company", form.company),
      phone: validateField("phone", form.phone),
    };
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (!turnstileToken) {
      setSubmitStatus("error");
      setSubmitError(t.captchaRequired);
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token: turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.errorMsg);
      }
      setSubmitStatus("success");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : t.errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: FormFields) =>
    `bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
      fieldErrors[field] ? "border-red-500/70 focus:border-red-500" : "border-white/10 focus:border-blue-500"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#161B2C] border border-white/10 rounded-[28px] p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase italic">{t.modalTitle}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            {submitStatus === "success" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-400" />
                </div>
                <p className="text-green-400 font-semibold">{t.successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
                <div>
                  <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} onBlur={() => handleBlur("name")}
                    placeholder={t.namePlaceholder} className={inputClass("name")} />
                  {fieldErrors.name && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")}
                    placeholder={t.emailPlaceholder} className={inputClass("email")} />
                  {fieldErrors.email && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <input value={form.company} onChange={(e) => handleChange("company", e.target.value)} onBlur={() => handleBlur("company")}
                    placeholder={t.companyPlaceholder} className={inputClass("company")} />
                  {fieldErrors.company && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.company}</p>}
                </div>
                <div>
                  <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} onBlur={() => handleBlur("phone")}
                    placeholder={t.phonePlaceholder} className={inputClass("phone")} />
                  {fieldErrors.phone && <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.phone}</p>}
                </div>

                <div className="flex justify-center my-2">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={(token) => setTurnstileToken(token)}
                  />
                </div>

                {submitStatus === "error" && <p className="text-red-400 text-sm">{submitError || t.errorMsg}</p>}
                <button type="submit" disabled={isSubmitting}
                  className="bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
                  {isSubmitting ? t.submitting : t.submitBtn} {!isSubmitting && <ArrowRight size={16} />}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
