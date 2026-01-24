"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Recipe {
  id: number;
  name: string;
  category: string;
  description: string;
  portions: number;
  margin: number;
  image?: string;
  price?: number;
}

interface CartItem extends Recipe {
  qty: number;
}

export default function MenuPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [settings, setSettings] = useState({ business_name: "Ev Yapımı Lezzetler" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: settingsData } = await supabase.from('settings').select('*').single();
    if (settingsData) setSettings(settingsData);

    const { data: recipesData } = await supabase.from('recipes').select('*').order('category');
    const { data: ingredients } = await supabase.from('ingredients').select('*');
    const { data: recipeIngredients } = await supabase.from('recipe_ingredients').select('*');

    if (recipesData && ingredients && recipeIngredients) {
      const recipesWithPrice = recipesData.map(recipe => {
        const recipeIngs = recipeIngredients.filter(ri => ri.recipe_id === recipe.id);
        const cost = recipeIngs.reduce((total, ri) => {
          const ing = ingredients.find(i => i.id === ri.ingredient_id);
          return total + (ing ? ing.price_per_unit * ri.amount : 0);
        }, 0);
        const totalPrice = Math.ceil(cost * recipe.margin);
        const pricePerPortion = Math.ceil(totalPrice / recipe.portions);
        return { ...recipe, price: pricePerPortion || 50 };
      });
      setRecipes(recipesWithPrice);
    if (recipesWithPrice.length > 0) {
  const cats = [...new Set(recipesWithPrice.map(r => r.category))];
  if (cats.length > 0 && !selectedCategory) {
    setSelectedCategory(cats[0]);
  }
}}
    
    setIsLoaded(true);
    
  };

const categories = [...new Set(recipes.map(r => r.category))];

const filteredRecipes = selectedCategory 
  ? recipes.filter(r => r.category === selectedCategory)
  : recipes;
  
  const addToCart = (recipe: Recipe) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === recipe.id);
      if (existing) {
        return prev.map(item => item.id === recipe.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...recipe, qty: 1 }];
    });
  };

  const removeFromCart = (recipeId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === recipeId);
      if (existing && existing.qty > 1) {
        return prev.map(item => item.id === recipeId ? { ...item, qty: item.qty - 1 } : item);
      }
      return prev.filter(item => item.id !== recipeId);
    });
  };

  const getQty = (recipeId: number) => cart.find(item => item.id === recipeId)?.qty || 0;
  const cartTotal = cart.reduce((acc, item) => acc + ((item.price || 0) * item.qty), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const sendOrder = async () => {
  if (cart.length === 0 || !customerName.trim() || isSubmitting) {
    if (!customerName.trim()) alert('Lütfen adınızı girin');
    return;
  }

  setIsSubmitting(true);

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ customer_name: customerName.trim(), customer_note: customerNote.trim(), total: cartTotal, status: 'pending' })
      .select()
      .single();

    if (error || !order) {
      alert('Sipariş gönderilemedi!');
      setIsSubmitting(false);
      return;
    }

    const orderItems = cart.map(item => ({
      order_id: order.id,
      recipe_id: item.id,
      recipe_name: item.name,
      quantity: item.qty,
      price: item.price || 0
    }));

    await supabase.from('order_items').insert(orderItems);

    setCart([]);
    setCustomerName('');
    setCustomerNote('');
    setShowCart(false);
    alert('Siparişiniz alındı! 🎉');
  } catch (err) {
    alert('Bir hata oluştu!');
  } finally {
    setIsSubmitting(false);
  }
};

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Menü yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
<header className="px-4 py-4 text-center">
          <h1 className="text-lg font-bold text-gray-900">{settings.business_name}</h1>
        </header>

        {/* Category Tabs */}
<div className="px-4 flex gap-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`pb-3 text-sm font-medium relative ${selectedCategory === cat ? 'text-blue-500' : 'text-gray-400'}`}
            >
              {cat}
              {selectedCategory === cat && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Sipariş Menüsü</h2>
          <p className="text-sm text-gray-400 mt-1">Taze ve günlük malzemelerle hazırlanan lezzetler.</p>
        </div>

        {/* Menu Items */}
        <div className="px-4 pb-40">
          <h3 className="text-base font-bold text-gray-900 mb-4">{selectedCategory}</h3>
          <div className="space-y-4">
            {filteredRecipes.map(recipe => {
              const qty = getQty(recipe.id);
              return (
                <div key={recipe.id} className="flex gap-3 items-start animate-fade-in">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">{recipe.name}</h4>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-blue-500 font-bold text-sm">{recipe.price} TL</span>
                      <span className="text-gray-400 text-xs">/ Porsiyon</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{recipe.description}</p>
                  </div>

                  {/* Quantity Control */}
                  <div className="shrink-0">
                    {qty > 0 ? (
                      <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-1 w-10">
                        <button onClick={() => addToCart(recipe)} className="w-8 h-8 flex items-center justify-center text-blue-500">
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                        <span className="text-sm font-bold text-gray-900 py-1">{qty}</span>
                        <button onClick={() => removeFromCart(recipe.id)} className="w-8 h-8 flex items-center justify-center text-gray-300">
                          <Minus size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(recipe)} className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                        <Plus size={20} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Footer */}
        {cartCount > 0 && (
          <div className="fixed bottom-20 left-0 right-0 p-4 z-40">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setShowCart(true)}
                className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-between px-5 shadow-xl shadow-blue-200 animate-slide-up"
              >
                <div>
                  <span className="text-sm text-blue-200">Sepetim: {cartCount} Ürün</span>
                  <div className="text-lg font-bold">{cartTotal} TL</div>
                </div>
                <div className="flex items-center gap-2">
                  <span>Siparişi Tamamla</span>
                  <ShoppingBag size={18} />
                </div>
              </button>
            </div>
          </div>
        )}

    {/* Cart Modal */}
{showCart && (
  <div className="fixed inset-0 bg-white z-50 flex flex-col">
    {/* Header */}
    <div className="p-4 flex items-center justify-between shrink-0">
      <h3 className="text-lg font-bold">Sepetim</h3>
      <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full active:scale-90">
        <span className="text-gray-400 text-xl">✕</span>
      </button>
    </div>

    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {cart.map(item => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
          <div>
            <h4 className="font-semibold text-sm">{item.name}</h4>
            <p className="text-xs text-gray-400">{item.price} TL x {item.qty}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-500">{(item.price || 0) * item.qty} TL</span>
            <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow active:scale-90">
              <Minus size={14} />
            </button>
            <span className="w-6 text-center font-semibold text-sm">{item.qty}</span>
            <button onClick={() => addToCart(item)} className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center active:scale-90">
              <Plus size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Customer Info */}
      <div className="mt-4 space-y-2">
        <input
          type="text"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="Adınız *"
          className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
        />
        <textarea
          value={customerNote}
          onChange={e => setCustomerNote(e.target.value)}
          placeholder="Notunuz (opsiyonel)"
          rows={2}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none resize-none"
        />
      </div>
    </div>

    {/* Fixed Footer */}
    <div className="p-4 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] shrink-0">
      <div className="flex justify-between mb-3">
        <span className="text-gray-500">Toplam</span>
        <span className="text-xl font-bold">{cartTotal} TL</span>
      </div>
      <button 
        onClick={sendOrder} 
        disabled={!customerName.trim() || isSubmitting}
        className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold active:scale-[0.98] disabled:bg-gray-300"
      >
        {isSubmitting ? 'Gönderiliyor...' : 'Siparişi Tamamla'}
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}