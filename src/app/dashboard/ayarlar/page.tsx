"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import toast from "react-hot-toast";

export default function AyarlarPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", shop_name: "", shop_description: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setForm({
        full_name: data.full_name,
        phone: data.phone || "",
        shop_name: data.shop_name,
        shop_description: data.shop_description || "",
        address: data.address || "",
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      shop_name: form.shop_name.trim(),
      shop_description: form.shop_description.trim() || null,
      address: form.address.trim() || null,
    }).eq("id", profile.id);
    if (error) toast.error("Hata: " + error.message);
    else toast.success("Bilgilerin kaydedildi ✅");
    setSaving(false);
  }

  const shopUrl = typeof window !== "undefined" && profile
    ? window.location.origin + "/dukkan/" + profile.shop_slug
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-mango-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-stone-800">Bilgilerim 👤</h1>
        <p className="text-base text-stone-400 mt-1">Profil ve dükkan bilgilerini düzenle</p>
      </div>

      <div className="card mb-6">
        <h3 className="text-base font-bold text-stone-800 mb-3">📱 Dükkan Linkin</h3>
        <div className="flex items-center gap-2">
          <input type="text" readOnly value={shopUrl} className="input-field flex-1 bg-stone-50 text-stone-600" />
          <button
            onClick={() => { navigator.clipboard.writeText(shopUrl); toast.success("Link kopyalandı! 📋"); }}
            className="btn-primary shrink-0"
          >
            Kopyala 📋
          </button>
        </div>
        <p className="text-sm text-stone-400 mt-3">Bu linki WhatsApp, Instagram veya istediğin yerde paylaş! 🚀</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-display font-bold text-stone-800 mb-6">Profil Bilgileri ✏️</h3>
        <form onSubmit={handleSave} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">👤 Ad Soyad</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">📞 Telefon</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="05XX XXX XX XX" />
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">🏪 Dükkan Adı</label>
            <input type="text" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} className="input-field" required />
            <p className="text-sm text-stone-400 mt-1">
              🔗 Slug: <span className="text-mango-500 font-semibold">{profile?.shop_slug}</span> (değiştirilemez)
            </p>
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">📝 Dükkan Açıklaması</label>
            <textarea value={form.shop_description} onChange={(e) => setForm({ ...form, shop_description: e.target.value })} className="input-field resize-none" rows={3} placeholder="Dükkanın hakkında kısa bilgi..." />
          </div>
          <div>
            <label className="block text-base font-semibold text-stone-700 mb-2">📍 Adres / Teslimat Bölgesi</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field resize-none" rows={2} placeholder="Hangi bölgelere teslimat yapıyorsun?" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-lg py-4">
            {saving ? "Kaydediliyor... ⏳" : "Kaydet ✅"}
          </button>
        </form>
      </div>
    </div>
  );
}