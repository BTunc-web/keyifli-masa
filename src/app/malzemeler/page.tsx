"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, Package, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  price_per_unit: number;
  category: string;
}

export default function Home() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    const { data } = await supabase.from('ingredients').select('*').order('name');
    if (data) setIngredients(data);
    setIsLoaded(true);
  };

  const categories = ['Tümü', ...Array.from(new Set(ingredients.map(i => i.category)))];

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tümü' || ing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = async (ingredient: Omit<Ingredient, 'id'>) => {
    if (editingItem) {
      await supabase.from('ingredients').update(ingredient).eq('id', editingItem.id);
    } else {
      await supabase.from('ingredients').insert(ingredient);
    }
    loadIngredients();
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) {
      await supabase.from('ingredients').delete().eq('id', id);
      loadIngredients();
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'Et': '🥩', 'Sebze': '🥬', 'Meyve': '🍎', 'Bakliyat': '🌾',
      'Süt Ürünleri': '🧀', 'Yağ': '🫒', 'Baharat': '🌶️', 'Temel': '🧂'
    };
    return emojis[category] || '📦';
  };

  const IngredientModal = () => {
    const [form, setForm] = useState({
      name: editingItem?.name || '',
      unit: editingItem?.unit || 'kg',
      price_per_unit: editingItem?.price_per_unit?.toString() || '',
      category: editingItem?.category || 'Sebze'
    });

    const units = ['kg', 'gr', 'lt', 'ml', 'adet', 'demet', 'paket'];
    const categoryOptions = ['Et', 'Sebze', 'Meyve', 'Bakliyat', 'Süt Ürünleri', 'Yağ', 'Baharat', 'Temel', 'Diğer'];

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between p-5">
            <h3 className="text-lg font-bold text-gray-900">
              {editingItem ? 'Malzemeyi Düzenle' : 'Yeni Malzeme Ekle'}
            </h3>
            <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Malzeme Adı</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Örn: Kıyma (Dana)"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Birim</label>
                <select
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Birim Fiyat (₺)</label>
                <input
                  type="number"
                  value={form.price_per_unit}
                  onChange={e => setForm({ ...form, price_per_unit: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.name || !form.price_per_unit) {
                  alert('Lütfen tüm alanları doldurun');
                  return;
                }
                handleSave({
                  name: form.name,
                  unit: form.unit,
                  price_per_unit: parseFloat(form.price_per_unit),
                  category: form.category
                });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {editingItem ? 'Güncelle' : 'Malzeme Ekle'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
<Header title="🍳 Keyifli Masa" subtitle="Malzeme Yönetimi" onAddClick={() => setShowModal(true)} />
    
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{ingredients.length}</div>
            <div className="text-xs text-gray-500">Malzeme</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">{categories.length - 1}</div>
            <div className="text-xs text-gray-500">Kategori</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {ingredients.length > 0 ? Math.round(ingredients.reduce((a, b) => a + b.price_per_unit, 0) / ingredients.length) : 0} ₺
            </div>
            <div className="text-xs text-gray-500">Ort. Fiyat</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Malzeme ara..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 flex items-center gap-2">
            <Package size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-700">Malzemeler ({filteredIngredients.length})</span>
          </div>

          {filteredIngredients.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-50" />
              <p>Malzeme bulunamadı</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredIngredients.map(ing => (
                <div key={ing.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">
                      {getCategoryEmoji(ing.category)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{ing.name}</h4>
                      <span className="text-xs text-gray-400">{ing.category} · 1 {ing.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <div className="font-bold text-blue-600">{ing.price_per_unit} ₺</div>
                    </div>
                    <button
                      onClick={() => { setEditingItem(ing); setShowModal(true); }}
                      className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(ing.id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && <IngredientModal />}
    </div>
  );
}