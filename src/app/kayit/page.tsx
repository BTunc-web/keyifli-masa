"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function KayitPage() {
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const slug = generateSlug(shopName);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!slug) return toast.error("Dükkan adı gerekli");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          shop_name: shopName,
          shop_slug: slug,
        },
      },
    });

    if (error) {
      toast.error("Kayıt başarısız 😕 " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Tebrikler, dükkanın hazır! 🎉");
    router.push("/giris");
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-display font-bold text-mango-600">
            🍽️ Keyifli Masa
          </Link>
          <p className="text-base text-stone-400 mt-3">Dükkanını aç, hemen başla! 🚀</p>
        </div>
        <form onSubmit={handleRegister} className="card space-y-5">
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">👤 Ad Soyad</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="Ayşe Yılmaz" required />
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">🏪 Dükkan Adı</label>
            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="input-field" placeholder="Ayşe'nin Mutfağı" required />
            {slug && (
              <p className="text-sm text-stone-400 mt-2">
                🔗 Dükkan linkin: <span className="text-mango-500 font-semibold">/dukkan/{slug}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">📧 E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="ornek@email.com" required />
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">🔒 Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="En az 6 karakter" minLength={6} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
            {loading ? "Oluşturuluyor... ⏳" : "Dükkanımı Aç! 🎉"}
          </button>
        </form>
        <p className="text-center text-base text-stone-400 mt-6">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-mango-500 font-bold hover:underline">Giriş Yap 👋</Link>
        </p>
      </div>
    </div>
  );
}