"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X, CheckCircle } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'order' | 'info' | 'success';
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  clearNotification: (id: number) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState<Notification | null>(null);

  // Bildirim sesi
  const playSound = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleBlB0teleZQdQdPeteZMHT/teleaFEHTqteleZEDPteleaEDP9e2YWw8AA==');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    // Realtime subscription for new orders
    const channel = supabase
      .channel('new-orders-notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as any;
          const notification: Notification = {
            id: Date.now(),
            title: '🎉 Yeni Sipariş!',
            message: `${newOrder.customer_name} - ${newOrder.total} TL`,
            type: 'order',
            timestamp: new Date()
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 10));
          setShowToast(notification);
          playSound();
          
          // Toast'u 5 saniye sonra kapat
          setTimeout(() => setShowToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playSound]);

  const clearNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount: notifications.length,
      clearNotification,
      clearAll 
    }}>
      {children}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[200] animate-slide-down">
          <div className="bg-white rounded-2xl shadow-2xl border p-4 flex items-start gap-3 min-w-[300px]">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center animate-bounce-in">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">{showToast.title}</h4>
              <p className="text-sm text-gray-500">{showToast.message}</p>
            </div>
            <button 
              onClick={() => setShowToast(null)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}