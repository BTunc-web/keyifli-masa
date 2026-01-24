"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

interface DailyReport {
  date: string;
  orderCount: number;
  totalRevenue: number;
  items: { name: string; quantity: number; revenue: number }[];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    const daysAgo = period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*');

    if (orders && orderItems) {
      // Günlük grupla
      const dailyMap = new Map<string, DailyReport>();

      orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('tr-TR');
        const items = orderItems.filter(item => item.order_id === order.id);

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            orderCount: 0,
            totalRevenue: 0,
            items: []
          });
        }

        const report = dailyMap.get(date)!;
        report.orderCount += 1;
        report.totalRevenue += order.total;

        items.forEach(item => {
          const existingItem = report.items.find(i => i.name === item.recipe_name);
          if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.revenue += item.price * item.quantity;
          } else {
            report.items.push({
              name: item.recipe_name,
              quantity: item.quantity,
              revenue: item.price * item.quantity
            });
          }
        });
      });

      setReports(Array.from(dailyMap.values()));
    }

    setIsLoaded(true);
  };

  const totalRevenue = reports.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="📊 Raporlar" subtitle="Satış ve performans analizi" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              period === 'week' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600'
            }`}
          >
            Son 7 Gün
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              period === 'month' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600'
            }`}
          >
            Son 30 Gün
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <DollarSign size={24} className="opacity-80 mb-2" />
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString('tr-TR')} ₺</div>
            <div className="text-xs opacity-80">Toplam Gelir</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <ShoppingBag size={24} className="opacity-80 mb-2" />
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="text-xs opacity-80">Sipariş</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <TrendingUp size={24} className="opacity-80 mb-2" />
            <div className="text-2xl font-bold">{avgOrderValue} ₺</div>
            <div className="text-xs opacity-80">Ort. Sipariş</div>
          </div>
        </div>

        {/* Daily Reports */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-700">Günlük Detay</span>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
              <p>Bu dönemde tamamlanan sipariş yok</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.map(report => (
                <div key={report.date} className="animate-fade-in">
                  <button
                    onClick={() => setExpandedDate(expandedDate === report.date ? null : report.date)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar size={18} className="text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{report.date}</div>
                        <div className="text-xs text-gray-400">{report.orderCount} sipariş</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-600">{report.totalRevenue.toLocaleString('tr-TR')} ₺</span>
                      <ChevronDown 
                        size={20} 
                        className={`text-gray-400 transition-transform ${expandedDate === report.date ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </button>

                  {expandedDate === report.date && (
                    <div className="px-4 pb-4 animate-slide-down">
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        {report.items.sort((a, b) => b.revenue - a.revenue).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}x {item.name}</span>
                            <span className="font-semibold text-gray-900">{item.revenue} ₺</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Sellers */}
        {reports.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-4">
            <div className="p-4 bg-gray-50">
              <span className="font-semibold text-gray-700">🏆 En Çok Satanlar</span>
            </div>
            <div className="p-4">
              {(() => {
                const allItems = reports.flatMap(r => r.items);
                const merged = allItems.reduce((acc, item) => {
                  const existing = acc.find(i => i.name === item.name);
                  if (existing) {
                    existing.quantity += item.quantity;
                    existing.revenue += item.revenue;
                  } else {
                    acc.push({ ...item });
                  }
                  return acc;
                }, [] as typeof allItems);

                return merged
                  .sort((a, b) => b.quantity - a.quantity)
                  .slice(0, 5)
                  .map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                          idx === 1 ? 'bg-gray-100 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{item.quantity} adet</div>
                        <div className="text-xs text-gray-400">{item.revenue} ₺</div>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}