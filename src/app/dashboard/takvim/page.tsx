"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_MAP } from "@/lib/types";
import type { Order } from "@/lib/types";

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

interface DayData {
  date: Date;
  orders: Order[];
  totalRevenue: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function TakvimPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadOrders(); }, [currentDate]);

  async function loadOrders() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("profile_id", user.id)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: true });

    setOrders(data || []);
    setLoading(false);
  }

  function getCalendarDays(): DayData[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pazartesi başlangıçlı haftalar
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: DayData[] = [];

    // Önceki ayın günleri
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, orders: [], totalRevenue: 0, isCurrentMonth: false, isToday: false });
    }

    // Bu ayın günleri
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      const dayOrders = orders.filter(o => {
        const od = new Date(o.created_at);
        return od.getDate() === day && od.getMonth() === month && od.getFullYear() === year;
      });
      const validOrders = dayOrders.filter(o => o.status !== "cancelled");
      const revenue = validOrders.reduce((s, o) => s + Number(o.total), 0);
      const isToday = d.getTime() === today.getTime();
      days.push({ date: d, orders: dayOrders, totalRevenue: revenue, isCurrentMonth: true, isToday });
    }

    // Sonraki ayın günleri (6 satır tamamla)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, orders: [], totalRevenue: 0, isCurrentMonth: false, isToday: false });
    }

    return days;
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  }

  function goToday() {
    setCurrentDate(new Date());
    setSelectedDay(null);
  }

  const calendarDays = getCalendarDays();
  const monthTotal = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const monthOrderCount = orders.filter(o => o.status !== "cancelled").length;
  const busyDays = new Set(orders.map(o => new Date(o.created_at).getDate())).size;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-stone-800">Sipariş Takvimi 📅</h1>
        <p className="text-base text-stone-400 mt-1">Günlük siparişlerini takvimden takip et</p>
      </div>

      {/* Ay Özeti */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-3xl border-2 bg-mango-50 border-mango-200 p-4 text-center">
          <span className="text-2xl">📦</span>
          <p className="text-sm text-stone-500 mt-2 font-medium">Sipariş</p>
          <p className="text-2xl font-bold text-stone-800">{monthOrderCount}</p>
        </div>
        <div className="rounded-3xl border-2 bg-sunshine-50 border-sunshine-200 p-4 text-center">
          <span className="text-2xl">💰</span>
          <p className="text-sm text-stone-500 mt-2 font-medium">Kazanç</p>
          <p className="text-2xl font-bold text-stone-800">{formatCurrency(monthTotal)}</p>
        </div>
        <div className="rounded-3xl border-2 bg-mint-50 border-mint-200 p-4 text-center">
          <span className="text-2xl">📆</span>
          <p className="text-sm text-stone-500 mt-2 font-medium">Aktif Gün</p>
          <p className="text-2xl font-bold text-stone-800">{busyDays}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Takvim */}
        <div className="flex-1">
          <div className="card">
            {/* Ay Navigasyonu */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-3 rounded-2xl hover:bg-stone-100 text-xl font-bold text-stone-600">←</button>
              <div className="text-center">
                <h2 className="text-xl font-display font-bold text-stone-800">
                  {MONTHS_TR[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={goToday} className="text-sm text-mango-500 font-semibold hover:underline mt-1">Bugüne Git</button>
              </div>
              <button onClick={nextMonth} className="p-3 rounded-2xl hover:bg-stone-100 text-xl font-bold text-stone-600">→</button>
            </div>

            {/* Gün Başlıkları */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_TR.map(d => (
                <div key={d} className="text-center text-sm font-bold text-stone-400 py-2">{d}</div>
              ))}
            </div>

            {/* Takvim Günleri */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-3 border-mango-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const hasOrders = day.orders.length > 0;
                  const isSelected = selectedDay?.date.getTime() === day.date.getTime();
                  return (
                    <button
                      key={idx}
                      onClick={() => day.isCurrentMonth ? setSelectedDay(day) : null}
                      className={
                        "relative p-2 rounded-2xl text-center min-h-[70px] flex flex-col items-center justify-start transition-all " +
                        (!day.isCurrentMonth ? "opacity-30 cursor-default " : "cursor-pointer hover:bg-stone-50 ") +
                        (isSelected ? "ring-2 ring-mango-500 bg-mango-50 " : "") +
                        (day.isToday ? "bg-mango-50 border-2 border-mango-300 " : "")
                      }
                    >
                      <span className={"text-sm font-bold " + (day.isToday ? "text-mango-600" : "text-stone-700")}>
                        {day.date.getDate()}
                      </span>
                      {hasOrders && day.isCurrentMonth && (
                        <>
                          <span className="text-[10px] font-bold text-mango-600 mt-1">
                            {day.orders.filter(o => o.status !== "cancelled").length} sipariş
                          </span>
                          <span className="text-[10px] font-bold text-mint-600">
                            {formatCurrency(day.totalRevenue)}
                          </span>
                        </>
                      )}
                      {hasOrders && day.isCurrentMonth && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {day.orders.slice(0, 3).map((o, i) => {
                            const st = ORDER_STATUS_MAP[o.status] || ORDER_STATUS_MAP.pending;
                            const dotColor = o.status === "delivered" ? "bg-mint-400" :
                              o.status === "cancelled" ? "bg-red-400" :
                              o.status === "pending" ? "bg-sunshine-500" : "bg-mango-500";
                            return <div key={i} className={"w-1.5 h-1.5 rounded-full " + dotColor} />;
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Seçili Gün Detayı */}
        <div className="lg:w-96 shrink-0">
          {selectedDay ? (
            <div className="card lg:sticky lg:top-8">
              <h3 className="text-xl font-display font-bold text-stone-800 mb-1">
                {selectedDay.date.getDate()} {MONTHS_TR[selectedDay.date.getMonth()]}
                {selectedDay.isToday && <span className="text-sm text-mango-500 ml-2">Bugün</span>}
              </h3>
              <p className="text-sm text-stone-400 mb-5">
                {selectedDay.orders.filter(o => o.status !== "cancelled").length} sipariş · {formatCurrency(selectedDay.totalRevenue)} kazanç
              </p>

              {selectedDay.orders.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl">😴</span>
                  <p className="text-stone-400 mt-3">Bu gün sipariş yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDay.orders.map(order => {
                    const st = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                    const time = new Date(order.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={order.id} className="p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-stone-800">{order.order_number || "#" + order.id}</span>
                              <span className={"badge text-xs " + st.bg + " " + st.color}>{st.label}</span>
                            </div>
                            <p className="text-base font-semibold text-stone-700">{order.customer_name}</p>
                            <p className="text-sm text-stone-400">🕐 {time}</p>
                          </div>
                          <p className="font-bold text-mango-600 text-lg">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16">
              <span className="text-5xl">👈</span>
              <p className="text-stone-400 mt-4 text-base">Takvimden bir gün seç</p>
              <p className="text-stone-300 mt-1 text-sm">Siparişleri görmek için</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}