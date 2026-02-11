"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

type Period = "week" | "month" | "all";

export default function RaporlarPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [daily, setDaily] = useState<{ label: string; revenue: number }[]>([]);
  const [top, setTop] = useState<{ name: string; count: number; revenue: number }[]>([]);
  const [summary, setSummary] = useState({ orders: 0, revenue: 0, avg: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, [period]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const start = new Date(now);
    if (period === "week") start.setDate(start.getDate() - 7);
    else if (period === "month") start.setDate(start.getDate() - 30);
    else start.setFullYear(2020);

    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("profile_id", user.id)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true });

    if (!orders) { setLoading(false); return; }

    const dMap = new Map<string, number>();
    const pMap = new Map<string, { count: number; revenue: number }>();
    let totalRev = 0;

    orders.forEach(o => {
      if (o.status === "cancelled") return;
      const key = new Date(o.created_at).toLocaleDateString("tr-TR", {
        day: "2-digit", month: "2-digit"
      });
      dMap.set(key, (dMap.get(key) || 0) + Number(o.total));
      totalRev += Number(o.total);

      if (o.order_items) {
        o.order_items.forEach((i: { recipe_name: string; quantity: number; price: number }) => {
          const ex = pMap.get(i.recipe_name) || { count: 0, revenue: 0 };
          ex.count += i.quantity;
          ex.revenue += Number(i.price) * i.quantity;
          pMap.set(i.recipe_name, ex);
        });
      }
    });

    const valid = orders.filter(o => o.status !== "cancelled").length;
    setSummary({
      orders: valid,
      revenue: totalRev,
      avg: valid > 0 ? totalRev / valid : 0,
    });
    setDaily(Array.from(dMap.entries()).map(([label, revenue]) => ({ label, revenue })));
    setTop(
      Array.from(pMap.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    );
    setLoading(false);
  }

  const COLORS = ["#FF7043", "#FFCA28", "#66BB6A", "#42A5F5", "#AB47BC"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-mango-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-800">Kazancım 💰</h1>
          <p className="text-base text-stone-400 mt-1">Satış analizlerin burada</p>
        </div>
        <div className="flex gap-1 bg-white rounded-2xl border-2 border-stone-200 p-1">
          {[
            { key: "week" as Period, label: "7 Gün" },
            { key: "month" as Period, label: "30 Gün" },
            { key: "all" as Period, label: "Tümü" },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={"px-5 py-2 rounded-xl text-base font-semibold " + (period === p.key ? "bg-mango-500 text-white" : "text-stone-600 hover:bg-stone-50")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Sipariş", value: summary.orders, icon: "📦", bg: "bg-mango-50 border-mango-200" },
          { label: "Toplam Kazanç", value: formatCurrency(summary.revenue), icon: "💰", bg: "bg-sunshine-50 border-sunshine-200" },
          { label: "Ort. Sipariş", value: formatCurrency(summary.avg), icon: "📊", bg: "bg-mint-50 border-mint-200" },
        ].map(s => (
          <div key={s.label} className={"rounded-3xl border-2 p-5 " + s.bg}>
            <span className="text-3xl">{s.icon}</span>
            <p className="text-sm text-stone-500 mt-3 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-display font-bold mb-4">Günlük Kazanç 📈</h3>
          {daily.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-stone-400 text-base">Henüz veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 12, fill: "#78716c" }} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Kazanç"]} />
                <Bar dataKey="revenue" fill="#FF7043" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-display font-bold mb-4">En Çok Satan 🏆</h3>
          {top.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-stone-400 text-base">Henüz veri yok</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={top} cx="50%" cy="50%" outerRadius={70} dataKey="revenue">
                    {top.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-3">
                {top.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-stone-700 truncate font-medium">{p.name}</span>
                    </div>
                    <span className="text-stone-500 shrink-0 font-semibold">{p.count} adet</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}