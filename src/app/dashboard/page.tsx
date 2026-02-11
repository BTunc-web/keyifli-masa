"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_MAP } from "@/lib/types";
import type { Order } from "@/lib/types";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, pendingOrders: 0, totalProducts: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayData } = await supabase.from("orders").select("total")
      .eq("profile_id", user.id).gte("created_at", today.toISOString()).neq("status", "cancelled");

    const { count: pendingCount } = await supabase.from("orders")
      .select("*", { count: "exact", head: true }).eq("profile_id", user.id).in("status", ["pending", "confirmed", "preparing"]);

    const { count: productCount } = await supabase.from("recipes")
      .select("*", { count: "exact", head: true }).eq("profile_id", user.id);

    const { data: orders } = await supabase.from("orders").select("*")
      .eq("profile_id", user.id).order("created_at", { ascending: false }).limit(5);

    setStats({
      todayOrders: todayData?.length || 0,
      todayRevenue: todayData?.reduce((s, o) => s + Number(o.total), 0) || 0,
      pendingOrders: pendingCount || 0,
      totalProducts: productCount || 0,
    });
    setRecentOrders(orders || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-stone-900">Genel Bakış</h1>
        <p className="text-sm text-stone-500 mt-1">Dükkanınızın günlük durumu</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Bugünkü Sipariş", value: stats.todayOrders, icon: "📦", color: "text-blue-600" },
          { label: "Bugünkü Gelir", value: formatCurrency(stats.todayRevenue), icon: "💰", color: "text-emerald-600" },
          { label: "Bekleyen", value: stats.pendingOrders, icon: "⏳", color: "text-amber-600" },
          { label: "Toplam Ürün", value: stats.totalProducts, icon: "🍽️", color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xs text-stone-500">{s.label}</p>
                <p className={"text-xl font-bold " + s.color}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-stone-900">Son Siparişler</h2>
          <Link href="/dashboard/siparisler" className="text-sm text-brand-500 font-medium hover:underline">
            Tümünü Gör
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">📭</span>
            <p className="text-stone-500 mt-3 text-sm">Henüz sipariş yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="table-header">#</th>
                  <th className="table-header">Müşteri</th>
                  <th className="table-header">Tutar</th>
                  <th className="table-header">Durum</th>
                  <th className="table-header">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                  return (
                    <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                      <td className="table-cell font-medium">{order.order_number || "#" + order.id}</td>
                      <td className="table-cell">
                        <p className="font-medium text-stone-800">{order.customer_name}</p>
                        {order.customer_phone && <p className="text-xs text-stone-400">{order.customer_phone}</p>}
                      </td>
                      <td className="table-cell font-semibold">{formatCurrency(order.total)}</td>
                      <td className="table-cell">
                        <span className={"badge " + status.bg + " " + status.color}>{status.label}</span>
                      </td>
                      <td className="table-cell text-stone-500 text-xs">{formatDate(order.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}