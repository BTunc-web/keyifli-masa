"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function GirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Giriş başarısız 😕 " + error.message);
      setLoading(false);
      return;
    }
    toast.success("Hoş geldin! 🎉");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-display font-bold text-mango-600">
            🍽️ Keyifli Masa
          </Link>
          <p className="text-base text-stone-400 mt-3">Mutfağına hoş geldin! 👋</p>
        </div>
        <form onSubmit={handleLogin} className="card space-y-5">
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">📧 E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="ornek@email.com" required />
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">🔒 Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
            {loading ? "Giriş yapılıyor... ⏳" : "Giriş Yap 🚀"}
          </button>
        </form>
        <p className="text-center text-base text-stone-400 mt-6">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-mango-500 font-bold hover:underline">Dükkan Aç! 🏪</Link>
        </p>
      </div>
    </div>
  );
}