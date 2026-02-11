"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { generateOrderNumber } from "@/lib/types";
import type { Profile, Category, Recipe, CartItem } from "@/lib/types";
import toast from "react-hot-toast";

interface Props {
  profile: Profile;
  categories: Category[];
  recipes: Recipe[];
}

function getPortionPrice(recipe: Recipe): number {
  const portions = recipe.portions && recipe.portions > 0 ? recipe.portions : 1;
  return Math.ceil(recipe.sale_price / portions);
}

function RecipeCard({
  recipe, cartItem, onAdd, onUpdate,
}: {
  recipe: Recipe;
  cartItem?: CartItem;
  onAdd: () => void;
  onUpdate: (d: number) => void;
}) {
  const portionPrice = getPortionPrice(recipe);
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-stone-100 hover:border-mango-200 transition-all">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-800">{recipe.name}</p>
        {recipe.description && (
          <p className="text-sm text-stone-400 mt-0.5 line-clamp-2">{recipe.description}</p>
        )}
        <p className="font-bold text-mango-600 mt-1">{formatCurrency(portionPrice)}</p>
      </div>
      {cartItem ? (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onUpdate(-1)} className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg font-bold hover:bg-stone-200">
            -
          </button>
          <span className="w-8 text-center text-lg font-bold">{cartItem.quantity}</span>
          <button onClick={() => onUpdate(1)} className="w-10 h-10 rounded-full bg-mango-500 text-white flex items-center justify-center text-lg font-bold hover:bg-mango-600">
            +
          </button>
        </div>
      ) : (
        <button onClick={onAdd} className="shrink-0 w-11 h-11 rounded-full bg-mango-500 text-white flex items-center justify-center text-2xl hover:bg-mango-600 shadow-md">
          +
        </button>
      )}
    </div>
  );
}

export default function ShopClient({ profile, categories, recipes }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const cartTotal = cart.reduce((s, i) => s + getPortionPrice(i.recipe) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(r: Recipe) {
    setCart(prev => {
      const ex = prev.find(i => i.recipe.id === r.id);
      if (ex) return prev.map(i => i.recipe.id === r.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { recipe: r, quantity: 1 }];
    });
    toast.success(r.name + " eklendi", { duration: 1500, style: { fontSize: "14px" } });
  }

  function updateQty(id: number, d: number) {
    setCart(prev =>
      prev.map(i => i.recipe.id === id ? { ...i, quantity: Math.max(0, i.quantity + d) } : i).filter(i => i.quantity > 0)
    );
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!cart.length) return toast.error("Sepet boş");
    if (!form.name.trim() || !form.phone.trim()) return toast.error("Ad ve telefon gerekli");
    setSubmitting(true);

    const { data: order, error } = await supabase.from("orders").insert({
      profile_id: profile.id,
      order_number: generateOrderNumber(),
      customer_name: form.name.trim(),
      customer_phone: form.phone.trim(),
      customer_address: form.address.trim() || null,
      customer_note: form.note.trim() || null,
      total: cartTotal,
      status: "pending",
    }).select().single();

    if (error || !order) {
      toast.error("Sipariş oluşturulamadı");
      setSubmitting(false);
      return;
    }

    await supabase.from("order_items").insert(
      cart.map(i => ({
        order_id: order.id,
        recipe_id: i.recipe.id,
        recipe_name: i.recipe.name,
        quantity: i.quantity,
        price: getPortionPrice(i.recipe),
      }))
    );

    setSuccess(true);
    setCart([]);
    setSubmitting(false);
  }

  const filtered = activeCat !== null ? recipes.filter(r => r.category_id === activeCat) : recipes;
  const grouped = categories
    .map(c => ({ category: c, items: filtered.filter(r => r.category_id === c.id) }))
    .filter(g => g.items.length > 0);
  const uncat = filtered.filter(r => !r.category_id);

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-mint-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">✅</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-stone-900 mb-3">Siparişiniz Alındı! 🎉</h2>
          <p className="text-base text-stone-500 mb-8">{profile.shop_name} siparişinizi hazırlamaya başlayacak.</p>
          <button
            onClick={() => { setSuccess(false); setShowCheckout(false); setShowCart(false); setForm({ name: "", phone: "", address: "", note: "" }); }}
            className="btn-primary text-lg px-8 py-4"
          >
            Yeni Sipariş Ver 🛒
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-stone-800 truncate">🍽️ {profile.shop_name}</h1>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-mango-500 text-white font-semibold hover:bg-mango-600 shadow-md"
          >
            🛒 {formatCurrency(cartTotal)}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {(profile.shop_description || profile.address) && (
        <div className="bg-gradient-to-br from-mango-50 to-cream py-6">
          <div className="max-w-4xl mx-auto px-4">
            {profile.shop_description && <p className="text-base text-stone-600">{profile.shop_description}</p>}
            {profile.address && <p className="text-sm text-stone-400 mt-1">📍 {profile.address}</p>}
          </div>
        </div>
      )}

      {categories.length > 1 && (
        <div className="sticky top-16 z-30 bg-white border-b border-stone-100">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3">
              <button
                onClick={() => setActiveCat(null)}
                className={"shrink-0 px-5 py-2.5 rounded-2xl font-semibold " + (activeCat === null ? "bg-mango-500 text-white shadow-md" : "bg-stone-100 text-stone-600")}
              >
                Tümü
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={"shrink-0 px-5 py-2.5 rounded-2xl font-semibold " + (activeCat === c.id ? "bg-mango-500 text-white shadow-md" : "bg-stone-100 text-stone-600")}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">🍽️</span>
            <p className="text-stone-400 mt-4 text-lg">Menüde henüz ürün yok</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ category, items }) => (
              <div key={category.id}>
                <h2 className="text-xl font-display font-bold text-stone-800 mb-4">{category.name}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {items.map(r => (
                    <RecipeCard key={r.id} recipe={r} cartItem={cart.find(c => c.recipe.id === r.id)} onAdd={() => addToCart(r)} onUpdate={d => updateQty(r.id, d)} />
                  ))}
                </div>
              </div>
            ))}
            {uncat.length > 0 && (
              <div>
                {grouped.length > 0 && <h2 className="text-xl font-display font-bold text-stone-800 mb-4">Diğer</h2>}
                <div className="grid sm:grid-cols-2 gap-3">
                  {uncat.map(r => (
                    <RecipeCard key={r.id} recipe={r} cartItem={cart.find(c => c.recipe.id === r.id)} onAdd={() => addToCart(r)} onUpdate={d => updateQty(r.id, d)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-4 left-4 right-4 z-30 sm:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between px-6 py-4 bg-mango-500 text-white rounded-2xl shadow-lg font-bold text-lg"
          >
            <span className="flex items-center gap-2">🛒 {cartCount} ürün</span>
            <span>{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
              <h3 className="text-xl font-display font-bold">Sepetiniz 🛒</h3>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-2xl hover:bg-stone-100 text-xl">✕</button>
            </div>

            {showCheckout ? (
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={submitOrder} className="space-y-5">
                  <div>
                    <label className="block text-base font-semibold text-stone-700 mb-2">👤 Adınız *</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-stone-700 mb-2">📞 Telefon *</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-stone-700 mb-2">📍 Adres</label>
                    <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field resize-none" rows={2} />
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-stone-700 mb-2">📝 Not</label>
                    <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="input-field resize-none" rows={2} />
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-5 space-y-2">
                    <p className="text-sm font-bold text-stone-500 uppercase">Sipariş Özeti</p>
                    {cart.map(i => (
                      <div key={i.recipe.id} className="flex justify-between text-base">
                        <span>{i.quantity}x {i.recipe.name}</span>
                        <span className="font-semibold">{formatCurrency(getPortionPrice(i.recipe) * i.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t border-stone-200 pt-3 text-lg">
                      <span>Toplam</span>
                      <span className="text-mango-600">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowCheckout(false)} className="btn-secondary flex-1 py-4">Geri</button>
                    <button type="submit" disabled={submitting} className="btn-primary flex-1 py-4">
                      {submitting ? "Gönderiliyor... ⏳" : "Sipariş Ver 🎉"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <span className="text-5xl">🛒</span>
                      <p className="text-stone-400 mt-4 text-base">Sepetiniz boş</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map(item => {
                        const pp = getPortionPrice(item.recipe);
                        return (
                          <div key={item.recipe.id} className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-800 truncate">{item.recipe.name}</p>
                              <p className="text-sm text-stone-400">{formatCurrency(pp)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQty(item.recipe.id, -1)} className="w-9 h-9 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center font-bold">-</button>
                              <span className="w-8 text-center font-bold">{item.quantity}</span>
                              <button onClick={() => updateQty(item.recipe.id, 1)} className="w-9 h-9 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center font-bold">+</button>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold">{formatCurrency(pp * item.quantity)}</p>
                              <button onClick={() => setCart(p => p.filter(x => x.recipe.id !== item.recipe.id))} className="text-xs text-red-400 hover:text-red-600 font-semibold">Kaldır</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="border-t border-stone-100 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600 font-semibold text-lg">Toplam</span>
                      <span className="text-2xl font-bold text-mango-600">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button onClick={() => setShowCheckout(true)} className="btn-primary w-full py-4 text-lg">Sipariş Ver 🎉</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}