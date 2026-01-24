"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ChefHat, ShoppingBag, ClipboardList, Settings, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    loadPendingCount();

    const channel = supabase
      .channel('navbar-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPendingCount = async () => {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingOrders(count || 0);
  };

const links = [
  { href: '/menu', label: 'Menü', icon: ShoppingBag },
  { href: '/malzemeler', label: 'Malzemeler', icon: Package },
  { href: '/recipes', label: 'Reçeteler', icon: ChefHat },
  { href: '/orders', label: 'Siparişler', icon: ClipboardList, badge: pendingOrders },
  { href: '/reports', label: 'Raporlar', icon: TrendingUp },
];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {link.badge && link.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : ''}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}