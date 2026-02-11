"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { ORDER_STATUS_MAP } from "@/lib/types";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import toast from "react-hot-toast";

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered"];

export default function SiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let q = supabase.from("orders").select("*").eq("profile_id", user.id).order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    const ch = supabase.channel("orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadOrders]);

  async function loadItems(order: Order) {
    setSelectedOrder(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems(data || []);
  }

  async function updateStatus(id: number, s: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status: s }).eq("id", id);
    if (error) return toast.error("Güncellenemedi");
    toast.success(ORDER_STATUS_MAP[s].label + " ✅");
    loadOrders();
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status: s });
  }

  function getWhatsAppUrl(phone: string): string {
    const num = phone.replace(/\D/g, "");
    return "https://wa.me/90" + num;
  }

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
        <h1 className="text-2xl font-display font-bold text-stone-800">Siparişlerim 📦</h1>
        <p className="text-base text-stone-400 mt-1">Gelen siparişleri buradan takip et</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "Tümü", emoji: "📋" },
          { key: "pending", label: "Yeni", emoji: "🔔" },
          { key: "confirmed", label: "Onaylı", emoji: "✅" },
          { key: "preparing", label: "Hazırlanıyor", emoji: "👩‍🍳" },
          { key: "ready", label: "Hazır", emoji: "🍽️" },
          { key: "delivered", label: "Teslim", emoji: "🎉" },
          { key: "cancelled", label: "İptal", emoji: "❌" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={"px-4 py-2.5 rounded-2xl text-base font-semibold transition-all " + (filter === f.key ? "bg-mango-500 text-white shadow-md" : "bg-white border-2 border-stone-200 text-stone-600 hover:bg-stone-50")}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="flex-1 space-y-3">
          {orders.length === 0 ? (
            <div className="card text-center py-16">
              <span className="text-6xl">📭</span>
              <h3 className="text-lg font-bold text-stone-700 mt-4">
                {filter === "all" ? "Henüz sipariş yok" : "Bu filtrede sipariş yok"}
              </h3>
              <p className="text-stone-400 mt-2">Dükkan linkini paylaşarak başla! 📱</p>
            </div>
          ) : (
            orders.map((order) => {
              const st = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
              return (
                <button
                  key={order.id}
                  onClick={() => loadItems(order)}
                  className={"w-full text-left rounded-3xl bg-white border-2 p-5 transition-all hover:shadow-md " + (selectedOrder?.id === order.id ? "border-mango-400 shadow-md" : "border-stone-100")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-800 text-base">{order.order_number || "#" + order.id}</span>
                        <span className={"badge " + st.bg + " " + st.color}>{st.label}</span>
                      </div>
                      <p className="text-base text-stone-700 font-semibold">{order.customer_name}</p>
                      <p className="text-sm text-stone-400">
                        {order.customer_phone ? formatPhone(order.customer_phone) + " · " : ""}
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-mango-600 shrink-0">{formatCurrency(order.total)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedOrder && (
          <div className="lg:w-96 shrink-0">
            <div className="card lg:sticky lg:top-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-display font-bold text-stone-800">
                  {selectedOrder.order_number || "#" + selectedOrder.id}
                </h3>
                <button onClick={() => setSelectedOrder(null)} className="lg:hidden p-2 hover:bg-stone-100 rounded-2xl text-xl">✕</button>
              </div>

              <div className="space-y-3 mb-5 pb-5 border-b border-stone-100">
                <div className="flex items-center gap-3 text-base">
                  <span>👤</span>
                  <span className="font-semibold">{selectedOrder.customer_name}</span>
                </div>
                {selectedOrder.customer_phone && (
                  <div className="flex items-center gap-3 text-base">
                    <span>📞</span>
                    <PhoneLink phone={selectedOrder.customer_phone} />
                  </div>
                )}
                {selectedOrder.customer_address && (
                  <div className="flex items-start gap-3 text-base">
                    <span>📍</span>
                    <span>{selectedOrder.customer_address}</span>
                  </div>
                )}
                {selectedOrder.customer_note && (
                  <div className="flex items-start gap-3 text-base">
                    <span>📝</span>
                    <span className="italic text-stone-500">{selectedOrder.customer_note}</span>
                  </div>
                )}
                {selectedOrder.customer_phone && (
                  <WhatsAppButton phone={selectedOrder.customer_phone} />
                )}
              </div>

              <div className="space-y-2 mb-5 pb-5 border-b border-stone-100">
                <p className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">🍲 Sipariş İçeriği</p>
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-base">
                    <span>{item.quantity}x {item.recipe_name}</span>
                    <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold pt-3 border-t border-stone-100">
                  <span>Toplam</span>
                  <span className="text-mango-600 text-lg">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">📋 Durumu Güncelle</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_FLOW.map((s) => {
                    const info = ORDER_STATUS_MAP[s];
                    const cur = selectedOrder.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedOrder.id, s)}
                        disabled={cur}
                        className={"px-4 py-3 rounded-2xl text-sm font-bold border-2 transition-all " + (cur ? info.bg + " " + info.color : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50")}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>
                {selectedOrder.status !== "cancelled" && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, "cancelled")}
                    className="w-full mt-2 px-4 py-3 rounded-2xl text-sm font-bold border-2 border-red-200 text-red-500 hover:bg-red-50"
                  >
                    ❌ İptal Et
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhoneLink({ phone }: { phone: string }) {
  return React.createElement("a", {
    href: "tel:" + phone,
    className: "text-mango-500 font-semibold hover:underline"
  }, formatPhone(phone));
}

function WhatsAppButton({ phone }: { phone: string }) {
  const num = phone.replace(/\D/g, "");
  const url = "https://wa.me/90" + num;
  return React.createElement("a", {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-green-500 text-white font-bold text-base hover:bg-green-600 transition-all"
  }, "💬 WhatsApp ile Yaz");
}