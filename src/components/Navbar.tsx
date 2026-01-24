"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Package, ChefHat, ShoppingBag, ClipboardList, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    loadPendingOrders();
    
    const channel = supabase
      .channel('navbar-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadPendingOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPendingOrders = async () => {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingOrders(count || 0);
  };

  // Cart sayfasında navbar'ı gizle
  if (pathname === '/cart') {
    return null;
  }

  const links = [
    { href: '/menu', label: 'Menü', icon: ShoppingBag },
    { href: '/malzemeler', label: 'Malzemeler', icon: Package },
    { href: '/recipes', label: 'Reçeteler', icon: ChefHat },
    { href: '/orders', label: 'Siparişler', icon: ClipboardList, badge: pendingOrders },
    { href: '/reports', label: 'Raporlar', icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="max-w-2xl mx-auto flex justify-around py-2">
        {links.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-2 px-3 relative ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <link.icon size={22} />
              <span className="text-xs mt-1">{link.label}</span>
              {link.badge && link.badge > 0 && (
                <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}