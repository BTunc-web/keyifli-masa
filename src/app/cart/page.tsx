"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('keyifli_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('keyifli_cart', JSON.stringify(newCart));
  };

  const addQty = (id: number) => {
    updateCart(cart.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  };

  const removeQty = (id: number) => {
    const item = cart.find(i => i.id === id);
    if (item && item.qty > 1) {
      updateCart(cart.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i));
    } else {
      updateCart(cart.filter(i => i.id !== id));
    }
  };

  const removeItem = (id: number) => {
    updateCart(cart.filter(i => i.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const sendOrder = async () => {
    if (cart.length === 0 || !customerName.trim() || isSubmitting) {
      if (!customerName.trim()) alert('Lütfen adınızı girin');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({ 
          customer_name: customerName.trim(), 
          customer_note: customerNote.trim(), 
          total: cartTotal, 
          status: 'pending' 
        })
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
        price: item.price
      }));

      await supabase.from('order_items').insert(orderItems);

      localStorage.removeItem('keyifli_cart');
      setCart([]);
      setCustomerName('');
      setCustomerNote('');
      
      alert('Siparişiniz alındı! 🎉');
      router.push('/menu');
    } catch (err) {
      alert('Bir hata oluştu!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-6xl mb-4">🛒</p>
          <p className="text-gray-500 mb-4">Sepetiniz boş</p>
          <button 
            onClick={() => router.push('/menu')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold active:scale-95"
          >
            Menüye Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Sepetim</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Cart Items */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {cart.map((item, index) => (
            <div 
              key={item.id} 
              className={`p-4 flex items-center gap-4 ${index !== cart.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-400">{item.price} TL / adet</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => removeQty(item.id)} 
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-90"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-bold">{item.qty}</span>
                <button 
                  onClick={() => addQty(item.id)} 
                  className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center active:scale-90"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-right min-w-[70px]">
                <p className="font-bold text-blue-500">{item.price * item.qty} TL</p>
              </div>

              <button 
                onClick={() => removeItem(item.id)} 
                className="w-8 h-8 text-red-400 hover:bg-red-50 rounded-full flex items-center justify-center active:scale-90"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Müşteri Bilgileri</h3>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Adınız *"
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={customerNote}
            onChange={e => setCustomerNote(e.target.value)}
            placeholder="Notunuz (opsiyonel)"
            rows={2}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fixed Footer */}
<div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500">Toplam</span>
            <span className="text-2xl font-bold">{cartTotal} TL</span>
          </div>
          <button 
            onClick={sendOrder} 
            disabled={!customerName.trim() || isSubmitting}
            className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Siparişi Tamamla'}
          </button>
        </div>
      </div>
    </div>
  );
}