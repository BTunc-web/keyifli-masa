"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import toast from "react-hot-toast";

const NAV = [
  { href: "/dashboard", label: "Mutfağım", icon: "🏠" },
  { href: "/dashboard/siparisler", label: "Siparişlerim", icon: "📦" },
  { href: "/dashboard/menu", label: "Yemeklerim", icon: "🍲" },
  { href: "/dashboard/takvim", label: "Takvim", icon: "📅" },
  { href: "/dashboard/raporlar", label: "Kazancım", icon: "💰" },
  { href: "/dashboard/ayarlar", label: "Bilgilerim", icon: "👤" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) setProfile(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  }

  function copyShopLink() {
    if (!profile) return;
    const url = window.location.origin + "/dukkan/" + profile.shop_slug;
    navigator.clipboard.writeText(url);
    toast.success("Link kopyalandı!");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-100 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-stone-100">
          <h2 className="font-display font-bold text-stone-800 truncate">
            {profile?.shop_name || "Yükleniyor..."}
          </h2>
          <button onClick={copyShopLink} className="text-xs text-brand-500 hover:underline mt-1">
            Dükkan linkini kopyala
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${active ? "bg-brand-50 text-brand-600" : "text-stone-600 hover:bg-stone-50"}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-stone-100">
          <div className="px-3 py-2 text-sm text-stone-500 truncate">
            {profile?.full_name}
          </div>
          <button onClick={handleLogout} className="sidebar-link text-red-500 hover:bg-red-50 w-full">
            <span>🚪</span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-stone-100 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-stone-100">
            ☰
          </button>
          <span className="font-display font-bold text-stone-800 truncate">
            {profile?.shop_name}
          </span>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}