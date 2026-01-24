"use client";

import { ChevronLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onAddClick?: () => void;
  addLabel?: string;
}

export default function Header({ title, subtitle, showBack = false, onAddClick, addLabel = "Ekle" }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">{addLabel}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}