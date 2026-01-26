"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, ShoppingBag } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  total: number;
}

interface NotificationContextType {
  notifications: Notification[];
  clearNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState<Notification | null>(null);

  // Bildirim sesi çal
  const playSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // İlk bip
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 800;
      oscillator1.type = 'sine';
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);

      // İkinci bip
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 1000;
      oscillator2.type = 'sine';
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.35);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.65);
      oscillator2.start(audioContext.currentTime + 0.35);
      oscillator2.stop(audioContext.currentTime + 0.65);

      // Üçüncü bip (yüksek)
      const oscillator3 = audioContext.createOscillator();
      const gainNode3 = audioContext.createGain();
      oscillator3.connect(gainNode3);
      gainNode3.connect(audioContext.destination);
      oscillator3.frequency.value = 1200;
      oscillator3.type = 'sine';
      gainNode3.gain.setValueAtTime(0.4, audioContext.currentTime + 0.7);
      gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
      oscillator3.start(audioContext.currentTime + 0.7);
      oscillator3.stop(audioContext.currentTime + 1.2);
    } catch (e) {
      console.log('Ses çalınamadı');
    }
  }, []);

  // Titreşim
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  }, []);

  useEffect(() => {
    // Sadece yönetim sayfalarında dinle (menu ve cart hariç)
    if (pathname === '/menu' || pathname === '/cart') return;

    const channel = supabase
      .channel('new-orders-notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as any;
          const notification: Notification = {
            id: Date.now(),
            title: 'Yeni Sipariş!',
            message: newOrder.customer_name,
            total: newOrder.total
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 10));
          setShowToast(notification);
          playSound();
          vibrate();
          
          // Toast'u 8 saniye sonra kapat
          setTimeout(() => setShowToast(null), 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname, playSound, vibrate]);

  const clearNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (showToast?.id === id) setShowToast(null);
  };

  return (
    <NotificationContext.Provider value={{ notifications, clearNotification }}>
      {children}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-4 right-4 z-[200] animate-slide-down">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border-l-4 border-green-500 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">🎉 {showToast.title}</h4>
              <p className="text-sm text-gray-600">{showToast.message}</p>
              <p className="text-sm font-bold text-green-600">{showToast.total} TL</p>
            </div>
            <button 
              onClick={() => setShowToast(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}