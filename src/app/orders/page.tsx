"use client";

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Trash2, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

interface OrderItem {
  id: number;
  recipe_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_note: string;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
    
    // Realtime subscription
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersData) {
      // Her sipariş için itemları yükle
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          return { ...order, items: items || [] };
        })
      );
      setOrders(ordersWithItems);
    }
    setIsLoaded(true);
  };

  const updateStatus = async (orderId: number, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    loadOrders();
    setSelectedOrder(null);
  };

  const deleteOrder = async (orderId: number) => {
    if (confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
      loadOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylandı';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header 
  title="📋 Siparişler" 
  subtitle={pendingCount > 0 ? `${pendingCount} yeni sipariş bekliyor` : 'Tüm siparişler'}
/>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'pending', label: 'Bekleyen' },
            { key: 'confirmed', label: 'Onaylanan' },
            { key: 'completed', label: 'Tamamlanan' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === f.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Clock size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">Henüz sipariş yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
                  order.status === 'pending' ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{order.customer_name || 'İsimsiz'}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{order.total} ₺</span>
                  </div>

                  {/* Items */}
                  <div className="text-sm text-gray-600 mb-3">
                    {order.items?.map(item => (
                      <span key={item.id} className="mr-2">{item.quantity}x {item.recipe_name}</span>
                    ))}
                  </div>

                  {order.customer_note && (
                    <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg mb-3">📝 {order.customer_note}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, 'confirmed')}
                          className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={16} /> Onayla
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="py-2 px-4 bg-red-100 text-red-600 rounded-xl"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={16} /> Tamamlandı
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="py-2 px-4 bg-gray-100 text-gray-600 rounded-xl"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="py-2 px-4 bg-gray-100 text-gray-400 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Sipariş Detayı</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Müşteri:</span>
                  <span className="font-semibold">{selectedOrder.customer_name || 'İsimsiz'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tarih:</span>
                  <span>{new Date(selectedOrder.created_at).toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Durum:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>

                <hr />

                <div className="space-y-2">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.recipe_name}</span>
                      <span className="font-semibold">{item.price * item.quantity} ₺</span>
                    </div>
                  ))}
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam:</span>
                  <span className="text-blue-600">{selectedOrder.total} ₺</span>
                </div>

                {selectedOrder.customer_note && (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-sm text-gray-500">Not:</span>
                    <p className="text-gray-700">{selectedOrder.customer_note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}