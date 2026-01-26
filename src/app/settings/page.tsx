"use client";

import React, { useState, useEffect } from 'react';
import { Save, Store, Percent, Phone, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    id: 1,
    business_name: 'Keyifli Masa',
    default_margin: 2.5,
    admin_phone: ''
  });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) setSettings(data);
    setIsLoaded(true);
  };

  const handleSave = async () => {
    await supabase.from('settings').update({
      business_name: settings.business_name,
      default_margin: settings.default_margin,
      admin_phone: settings.admin_phone
    }).eq('id', settings.id);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/menu`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="⚙️ Ayarlar" subtitle="İşletme bilgileri ve tercihler" />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* İşletme Adı */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">İşletme Adı</h3>
              <p className="text-xs text-gray-500">Müşterilere gösterilecek isim</p>
            </div>
          </div>
          <input
            type="text"
            value={settings.business_name}
            onChange={e => setSettings({ ...settings, business_name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="İşletme adı"
          />
        </div>

        {/* Admin Telefon */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Phone size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin Telefon (WhatsApp)</h3>
              <p className="text-xs text-gray-500">Sipariş bildirimleri için</p>
            </div>
          </div>
          <input
            type="tel"
            value={settings.admin_phone}
            onChange={e => setSettings({ ...settings, admin_phone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="905551234567"
          />
          <p className="text-xs text-gray-400 mt-2">Başında 90 ile yazın (örn: 905551234567)</p>
        </div>

        {/* Varsayılan Kâr Marjı */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Percent size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Varsayılan Kâr Marjı</h3>
              <p className="text-xs text-gray-500">Yeni reçeteler için varsayılan çarpan</p>
            </div>
          </div>
          <input
            type="number"
            value={settings.default_margin}
            onChange={e => setSettings({ ...settings, default_margin: parseFloat(e.target.value) || 1 })}
            step="0.1"
            min="1"
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-2">Örnek: 2.5 = Maliyetin 2.5 katı satış fiyatı</p>
        </div>

        {/* Kaydet */}
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved ? <Check size={20} /> : <Save size={20} />}
          {saved ? 'Kaydedildi!' : 'Kaydet'}
        </button>

        {/* Menü Linki */}
        <div className="bg-amber-50 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 mb-2">📱 Müşteri Menü Linki</h3>
          <p className="text-sm text-amber-700 mb-3">
            Bu linki müşterilerinize gönderin, sipariş verebilsinler:
          </p>
          <div className="bg-white rounded-xl p-3 flex items-center justify-between gap-2">
            <code className="text-sm text-gray-600 truncate flex-1">
              {typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu'}
            </code>
            <button
              onClick={copyLink}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Kopyalandı!' : 'Kopyala'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}