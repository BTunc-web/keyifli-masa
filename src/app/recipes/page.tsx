"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X, Check, ChefHat, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  price_per_unit: number;
}

interface RecipeIngredient {
  ingredient_id: number;
  amount: number;
}

interface Recipe {
  id: number;
  name: string;
  category: string;
  description: string;
  portions: number;
  margin: number;
  image?: string;
}

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: ingredientsData } = await supabase.from('ingredients').select('*');
    const { data: recipesData } = await supabase.from('recipes').select('*').order('name');
    const { data: recipeIngsData } = await supabase.from('recipe_ingredients').select('*');
    
    if (ingredientsData) setIngredients(ingredientsData);
    if (recipesData) setRecipes(recipesData);
    if (recipeIngsData) setRecipeIngredients(recipeIngsData);
    setIsLoaded(true);
  };

  const categories = ['Tümü', ...Array.from(new Set(recipes.map(r => r.category)))];

  const filteredRecipes = recipes.filter(r => 
    selectedCategory === 'Tümü' || r.category === selectedCategory
  );

  const calculateCost = (recipeId: number) => {
    const recipeIngs = recipeIngredients.filter(ri => ri.recipe_id === recipeId);
    return recipeIngs.reduce((total, ri) => {
      const ing = ingredients.find(i => i.id === ri.ingredient_id);
      return total + (ing ? ing.price_per_unit * ri.amount : 0);
    }, 0);
  };

  const calculatePrice = (recipe: Recipe) => {
    const cost = calculateCost(recipe.id);
    return Math.ceil(cost * recipe.margin);
  };

  const calculatePricePerPortion = (recipe: Recipe) => {
    return Math.ceil(calculatePrice(recipe) / recipe.portions);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu reçeteyi silmek istediğinize emin misiniz?')) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      await supabase.from('recipes').delete().eq('id', id);
      loadData();
    }
  };

  const RecipeModal = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
      name: editingRecipe?.name || '',
      category: editingRecipe?.category || 'Ana Yemek',
      description: editingRecipe?.description || '',
      portions: editingRecipe?.portions || 4,
      margin: editingRecipe?.margin || 2.5,
      image: editingRecipe?.image || '',
      ingredients: [] as RecipeIngredient[]
    });

    const [selectedIngredient, setSelectedIngredient] = useState<number>(0);
    const [amount, setAmount] = useState('');

    useEffect(() => {
      if (editingRecipe) {
        const existingIngs = recipeIngredients
          .filter(ri => ri.recipe_id === editingRecipe.id)
          .map(ri => ({ ingredient_id: ri.ingredient_id, amount: ri.amount }));
        setForm(prev => ({ ...prev, ingredients: existingIngs }));
      }
    }, [editingRecipe]);

    const categoryOptions = ['Meze', 'Ana Yemek', 'Yan Yemek', 'Çorba', 'Salata', 'Tatlı', 'İçecek'];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert('Dosya boyutu 2MB\'dan küçük olmalı');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setForm({ ...form, image: reader.result as string });
        reader.readAsDataURL(file);
      }
    };

    const addIngredientToRecipe = () => {
      if (!selectedIngredient || !amount) return;
      const exists = form.ingredients.find(i => i.ingredient_id === selectedIngredient);
      if (exists) {
        setForm({
          ...form,
          ingredients: form.ingredients.map(i => 
            i.ingredient_id === selectedIngredient ? { ...i, amount: i.amount + parseFloat(amount) } : i
          )
        });
      } else {
        setForm({
          ...form,
          ingredients: [...form.ingredients, { ingredient_id: selectedIngredient, amount: parseFloat(amount) }]
        });
      }
      setSelectedIngredient(0);
      setAmount('');
    };

    const removeIngredientFromRecipe = (ingredientId: number) => {
      setForm({ ...form, ingredients: form.ingredients.filter(i => i.ingredient_id !== ingredientId) });
    };

    const getIngredientById = (id: number) => ingredients.find(i => i.id === id);

    const currentCost = form.ingredients.reduce((total, item) => {
      const ing = getIngredientById(item.ingredient_id);
      return total + (ing ? ing.price_per_unit * item.amount : 0);
    }, 0);

    const currentPrice = Math.ceil(currentCost * form.margin);
    const currentPricePerPortion = form.portions > 0 ? Math.ceil(currentPrice / form.portions) : 0;

    const handleSave = async () => {
      if (!form.name) {
        alert('Lütfen reçete adı girin');
        return;
      }

      const recipeData = {
        name: form.name,
        category: form.category,
        description: form.description,
        portions: form.portions,
        margin: form.margin,
        image: form.image
      };

      let recipeId = editingRecipe?.id;

      if (editingRecipe) {
        await supabase.from('recipes').update(recipeData).eq('id', editingRecipe.id);
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', editingRecipe.id);
      } else {
        const { data } = await supabase.from('recipes').insert(recipeData).select().single();
        recipeId = data?.id;
      }

      if (recipeId && form.ingredients.length > 0) {
        const ingredientsToInsert = form.ingredients.map(ing => ({
          recipe_id: recipeId,
          ingredient_id: ing.ingredient_id,
          amount: ing.amount
        }));
        await supabase.from('recipe_ingredients').insert(ingredientsToInsert);
      }

      loadData();
      setShowModal(false);
      setEditingRecipe(null);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 sticky top-0 bg-white border-b">
            <h3 className="text-lg font-bold">{editingRecipe ? 'Reçeteyi Düzenle' : 'Yeni Reçete Ekle'}</h3>
            <button onClick={() => { setShowModal(false); setEditingRecipe(null); }} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fotoğraf</label>
              <div className="flex items-start gap-4">
                {form.image ? (
                  <div className="relative">
                    <img src={form.image} alt="Reçete" className="w-24 h-24 object-cover rounded-xl" />
                    <button
                      onClick={() => setForm({ ...form, image: '' })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500"
                  >
                    <ImageIcon size={24} />
                    <span className="text-xs mt-1">Ekle</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
            </div>

            {/* Name & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reçete Adı</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                  placeholder="Örn: Zeytinyağlı Sarma"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                >
                  {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Porsiyon</label>
                <input
                  type="number"
                  value={form.portions}
                  onChange={e => setForm({ ...form, portions: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Açıklama</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none resize-none"
                placeholder="Kısa açıklama..."
              />
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Malzemeler</label>
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedIngredient}
                  onChange={e => setSelectedIngredient(parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-sm"
                >
                  <option value={0}>Malzeme seç...</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.price_per_unit}₺/{ing.unit})</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Miktar"
                  step="0.01"
                  className="w-20 px-3 py-2 bg-gray-50 rounded-xl outline-none text-sm"
                />
                <button onClick={addIngredientToRecipe} className="px-3 py-2 bg-emerald-500 text-white rounded-xl">
                  <Plus size={18} />
                </button>
              </div>

              {form.ingredients.length > 0 ? (
                <div className="space-y-2">
                  {form.ingredients.map(item => {
                    const ing = getIngredientById(item.ingredient_id);
                    if (!ing) return null;
                    return (
                      <div key={item.ingredient_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <span>{ing.name} - {item.amount} {ing.unit}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-semibold">{(ing.price_per_unit * item.amount).toFixed(0)} ₺</span>
                          <button onClick={() => removeIngredientFromRecipe(item.ingredient_id)} className="text-red-500">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-xl">Malzeme eklenmedi</div>
              )}
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fiyatlandırma</label>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Kâr Marjı (Çarpan)</label>
                <input
                  type="number"
                  value={form.margin}
                  onChange={e => setForm({ ...form, margin: parseFloat(e.target.value) || 1 })}
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-50 p-3 rounded-xl text-center">
                  <div className="text-xs text-red-600">Maliyet</div>
                  <div className="font-bold text-red-700">{currentCost.toFixed(0)} ₺</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl text-center">
                  <div className="text-xs text-blue-600">Toplam</div>
                  <div className="font-bold text-blue-700">{currentPrice} ₺</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl text-center">
                  <div className="text-xs text-emerald-600">Porsiyon</div>
                  <div className="font-bold text-emerald-700">{currentPricePerPortion} ₺</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {editingRecipe ? 'Güncelle' : 'Reçete Ekle'}
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
      <Header 
  title="📖 Reçeteler" 
  subtitle="Maliyet ve fiyat yönetimi" 
  onAddClick={() => setShowModal(true)}
/>

      <main className="max-w-2xl mx-auto px-4 py-6">
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

        {/* Recipes */}
        {filteredRecipes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <ChefHat size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">Henüz reçete eklenmedi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecipes.map(recipe => {
              const cost = calculateCost(recipe.id);
              const price = calculatePrice(recipe);
              const pricePerPortion = calculatePricePerPortion(recipe);
              const recipeIngs = recipeIngredients.filter(ri => ri.recipe_id === recipe.id);

              return (
                <div key={recipe.id} className="bg-white rounded-2xl shadow-sm overflow-hidden p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      {recipe.image ? (
                        <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <div>
                          <span className="text-xs font-bold text-blue-600">{recipe.category}</span>
                          <h3 className="font-bold text-gray-900">{recipe.name}</h3>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingRecipe(recipe); setShowModal(true); }} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(recipe.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">{recipe.description}</p>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {recipeIngs.map(ri => {
                      const ing = ingredients.find(i => i.id === ri.ingredient_id);
                      return ing ? (
                        <span key={ri.ingredient_id} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {ing.name} ({ri.amount} {ing.unit})
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <div className="bg-red-50 p-2 rounded-lg text-center">
                      <div className="text-[10px] text-red-600">Maliyet</div>
                      <div className="text-sm font-bold text-red-700">{cost.toFixed(0)} ₺</div>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg text-center">
                      <div className="text-[10px] text-emerald-600">Kâr</div>
                      <div className="text-sm font-bold text-emerald-700">{(price - cost).toFixed(0)} ₺</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg text-center">
                      <div className="text-[10px] text-blue-600">Toplam</div>
                      <div className="text-sm font-bold text-blue-700">{price} ₺</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg text-center">
                      <div className="text-[10px] text-purple-600">Porsiyon</div>
                      <div className="text-sm font-bold text-purple-700">{pricePerPortion} ₺</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && <RecipeModal />}
    </div>
  );
}