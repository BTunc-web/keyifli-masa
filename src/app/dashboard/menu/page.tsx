"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import type { Category } from "@/lib/types";
import toast from "react-hot-toast";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  price_per_unit: number;
  profile_id: string;
}

interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  amount: number;
}

interface Recipe {
  id: number;
  name: string;
  category: string;
  category_id: number | null;
  description: string | null;
  portions: number;
  margin: number;
  sale_price: number;
  is_active: boolean;
  profile_id: string;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"recipes" | "ingredients" | "categories">("recipes");

  // Modals
  const [showIngModal, setShowIngModal] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [ingForm, setIngForm] = useState({ name: "", unit: "kg", price_per_unit: "" });

  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    name: "", description: "", category_id: "", category: "",
    portions: "4", margin: "2.5", is_active: true,
  });
  const [recipeIngs, setRecipeIngs] = useState<{ ingredientId: number; amount: string }[]>([]);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");

  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: cats }, { data: recs }, { data: ings }, { data: ri }] = await Promise.all([
      supabase.from("categories").select("*").eq("profile_id", user.id).order("sort_order"),
      supabase.from("recipes").select("*").eq("profile_id", user.id).order("name"),
      supabase.from("ingredients").select("*").eq("profile_id", user.id).order("name"),
      supabase.from("recipe_ingredients").select("*"),
    ]);

    setCategories(cats || []);
    setRecipes(recs || []);
    setIngredients(ings || []);
    setRecipeIngredients(ri || []);
    setLoading(false);
  }

  // ==================== COST CALCULATIONS ====================
  function getRecipeCost(recipeId: number): number {
    const ri = recipeIngredients.filter(r => r.recipe_id === recipeId);
    return ri.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredient_id);
      return total + (ing ? ing.price_per_unit * item.amount : 0);
    }, 0);
  }

  function getRecipeSalePrice(recipe: Recipe): number {
    const cost = getRecipeCost(recipe.id);
    return Math.ceil(cost * recipe.margin);
  }

  function getPortionPrice(recipe: Recipe): number {
    const total = getRecipeSalePrice(recipe);
    return recipe.portions > 0 ? Math.ceil(total / recipe.portions) : total;
  }

  // ==================== INGREDIENT CRUD ====================
  function openIng(ing?: Ingredient) {
    setEditingIng(ing || null);
    setIngForm({
      name: ing?.name || "",
      unit: ing?.unit || "kg",
      price_per_unit: ing ? String(ing.price_per_unit) : "",
    });
    setShowIngModal(true);
  }

  async function saveIng() {
    if (!ingForm.name.trim() || !ingForm.price_per_unit) return toast.error("Ad ve fiyat gerekli");
    const payload = {
      profile_id: userId,
      name: ingForm.name.trim(),
      unit: ingForm.unit,
      price_per_unit: parseFloat(ingForm.price_per_unit),
    };
    if (editingIng) {
      await supabase.from("ingredients").update(payload).eq("id", editingIng.id);
      toast.success("Güncellendi ✅");
    } else {
      await supabase.from("ingredients").insert(payload);
      toast.success("Malzeme eklendi 🧅");
    }
    setShowIngModal(false);
    load();
  }

  async function delIng(ing: Ingredient) {
    if (!confirm(ing.name + " silinsin mi?")) return;
    await supabase.from("ingredients").delete().eq("id", ing.id);
    toast.success("Silindi");
    load();
  }

  // ==================== CATEGORY CRUD ====================
  function openCat(cat?: Category) {
    setEditingCat(cat || null);
    setCatName(cat?.name || "");
    setShowCatModal(true);
  }

  async function saveCat() {
    if (!catName.trim()) return toast.error("Kategori adı gerekli");
    if (editingCat) {
      await supabase.from("categories").update({ name: catName.trim() }).eq("id", editingCat.id);
      toast.success("Güncellendi ✅");
    } else {
      await supabase.from("categories").insert({ profile_id: userId, name: catName.trim(), sort_order: categories.length });
      toast.success("Kategori eklendi 📁");
    }
    setShowCatModal(false);
    load();
  }

  async function delCat(c: Category) {
    if (!confirm(c.name + " silinsin mi?")) return;
    await supabase.from("categories").delete().eq("id", c.id);
    toast.success("Silindi");
    load();
  }

  // ==================== RECIPE CRUD ====================
  function openRecipe(r?: Recipe) {
    if (r) {
      setEditingRecipe(r);
      setRecipeForm({
        name: r.name,
        description: r.description || "",
        category_id: r.category_id ? String(r.category_id) : "",
        category: r.category || "",
        portions: String(r.portions || 4),
        margin: String(r.margin || 2.5),
        is_active: r.is_active,
      });
      const ri = recipeIngredients.filter(x => x.recipe_id === r.id);
      setRecipeIngs(ri.map(x => ({ ingredientId: x.ingredient_id, amount: String(x.amount) })));
    } else {
      setEditingRecipe(null);
      setRecipeForm({ name: "", description: "", category_id: "", category: "", portions: "4", margin: "2.5", is_active: true });
      setRecipeIngs([]);
    }
    setShowRecipeModal(true);
  }

  function addIngToRecipe() {
    setRecipeIngs(prev => [...prev, { ingredientId: 0, amount: "" }]);
  }

  function removeIngFromRecipe(idx: number) {
    setRecipeIngs(prev => prev.filter((_, i) => i !== idx));
  }

  function getModalCost(): number {
    return recipeIngs.reduce((total, ri) => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      const amt = parseFloat(ri.amount) || 0;
      return total + (ing ? ing.price_per_unit * amt : 0);
    }, 0);
  }

  async function saveRecipe() {
    if (!recipeForm.name.trim()) return toast.error("Reçete adı gerekli");
    const margin = parseFloat(recipeForm.margin) || 2.5;
    const portions = parseInt(recipeForm.portions) || 4;
    const cost = getModalCost();
    const salePrice = Math.ceil(cost * margin);
    const catObj = categories.find(c => c.id === parseInt(recipeForm.category_id));

    const payload = {
      profile_id: userId,
      name: recipeForm.name.trim(),
      description: recipeForm.description.trim() || null,
      category_id: recipeForm.category_id ? parseInt(recipeForm.category_id) : null,
      category: catObj ? catObj.name : recipeForm.category || "Genel",
      portions,
      margin,
      sale_price: salePrice,
      is_active: recipeForm.is_active,
    };

    let recipeId: number;
    if (editingRecipe) {
      await supabase.from("recipes").update(payload).eq("id", editingRecipe.id);
      recipeId = editingRecipe.id;
      // Eski recipe_ingredients sil
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
    } else {
      const { data } = await supabase.from("recipes").insert(payload).select().single();
      if (!data) return toast.error("Kayıt başarısız");
      recipeId = data.id;
    }

    // Yeni recipe_ingredients ekle
    const validIngs = recipeIngs.filter(ri => ri.ingredientId > 0 && parseFloat(ri.amount) > 0);
    if (validIngs.length > 0) {
      await supabase.from("recipe_ingredients").insert(
        validIngs.map(ri => ({
          recipe_id: recipeId,
          ingredient_id: ri.ingredientId,
          amount: parseFloat(ri.amount),
        }))
      );
    }

    toast.success(editingRecipe ? "Güncellendi ✅" : "Reçete eklendi 🍲");
    setShowRecipeModal(false);
    load();
  }

  async function delRecipe(r: Recipe) {
    if (!confirm(r.name + " silinsin mi?")) return;
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", r.id);
    await supabase.from("recipes").delete().eq("id", r.id);
    toast.success("Silindi");
    load();
  }

  async function toggleActive(r: Recipe) {
    await supabase.from("recipes").update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-mango-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const UNITS = ["kg", "g", "lt", "ml", "adet", "demet", "paket", "kutu", "kavanoz", "poşet"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-800">Yemeklerim 🍲</h1>
          <p className="text-base text-stone-400 mt-1">Reçeteler, malzemeler ve kategoriler</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-white rounded-2xl border-2 border-stone-200 p-1 mb-6">
        {[
          { key: "recipes" as const, label: "Reçeteler", emoji: "🍲" },
          { key: "ingredients" as const, label: "Malzemeler", emoji: "🧅" },
          { key: "categories" as const, label: "Kategoriler", emoji: "📁" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={"flex-1 px-4 py-3 rounded-xl text-base font-semibold transition-all " + (activeTab === t.key ? "bg-mango-500 text-white shadow-md" : "text-stone-600 hover:bg-stone-50")}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ==================== RECIPES TAB ==================== */}
      {activeTab === "recipes" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => openRecipe()} className="btn-primary">+ Yeni Reçete 🍳</button>
          </div>
          {recipes.length === 0 ? (
            <div className="card text-center py-16">
              <span className="text-6xl">🍳</span>
              <h3 className="text-xl font-bold text-stone-800 mt-5">Henüz reçete yok</h3>
              <p className="text-base text-stone-400 mt-2 mb-6">Önce malzemeleri ekle, sonra reçeteleri oluştur!</p>
              <button onClick={() => openRecipe()} className="btn-primary">+ Yeni Reçete 🍳</button>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map(r => {
                const cost = getRecipeCost(r.id);
                const salePrice = getRecipeSalePrice(r);
                const portionPrice = getPortionPrice(r);
                const riCount = recipeIngredients.filter(x => x.recipe_id === r.id).length;
                return (
                  <div
                    key={r.id}
                    className={"rounded-3xl bg-white border-2 p-5 transition-all " + (r.is_active ? "border-stone-100" : "border-stone-200 opacity-60")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-stone-800 text-lg">{r.name}</p>
                          {r.category && <span className="text-xs px-2 py-0.5 rounded-full bg-mango-50 text-mango-600 font-medium">{r.category}</span>}
                          {!r.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-500">Pasif</span>}
                        </div>
                        {r.description && <p className="text-sm text-stone-400 mt-1">{r.description}</p>}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <span className="text-stone-500">{riCount} malzeme</span>
                          <span className="text-stone-500">{r.portions} porsiyon</span>
                          <span className="text-stone-500">×{r.margin} marj</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="grid grid-cols-3 gap-3 text-center mb-2">
                          <div className="bg-red-50 px-3 py-2 rounded-xl">
                            <p className="text-[10px] text-red-500 font-bold uppercase">Maliyet</p>
                            <p className="text-sm font-bold text-red-700">{formatCurrency(cost)}</p>
                          </div>
                          <div className="bg-mint-50 px-3 py-2 rounded-xl">
                            <p className="text-[10px] text-mint-600 font-bold uppercase">Satış</p>
                            <p className="text-sm font-bold text-mint-800">{formatCurrency(salePrice)}</p>
                          </div>
                          <div className="bg-sunshine-50 px-3 py-2 rounded-xl">
                            <p className="text-[10px] text-sunshine-700 font-bold uppercase">Porsiyon</p>
                            <p className="text-sm font-bold text-sunshine-900">{formatCurrency(portionPrice)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => toggleActive(r)} className="p-2 rounded-2xl hover:bg-stone-100 text-stone-400">{r.is_active ? "👁️" : "👁️‍🗨️"}</button>
                          <button onClick={() => openRecipe(r)} className="p-2 rounded-2xl hover:bg-stone-100 text-stone-400">✏️</button>
                          <button onClick={() => delRecipe(r)} className="p-2 rounded-2xl hover:bg-red-50 text-stone-400">🗑️</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== INGREDIENTS TAB ==================== */}
      {activeTab === "ingredients" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => openIng()} className="btn-primary">+ Malzeme Ekle 🧅</button>
          </div>
          {ingredients.length === 0 ? (
            <div className="card text-center py-16">
              <span className="text-6xl">🧅</span>
              <h3 className="text-xl font-bold text-stone-800 mt-5">Henüz malzeme yok</h3>
              <p className="text-base text-stone-400 mt-2 mb-6">Market fiyatlarıyla malzemeleri ekle</p>
              <button onClick={() => openIng()} className="btn-primary">+ Malzeme Ekle 🧅</button>
            </div>
          ) : (
            <div className="card">
              <div className="space-y-2">
                {ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50">
                    <div>
                      <p className="font-semibold text-stone-800">{ing.name}</p>
                      <p className="text-sm text-stone-400">1 {ing.unit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-mango-600">{formatCurrency(ing.price_per_unit)}</span>
                      <button onClick={() => openIng(ing)} className="p-2 rounded-2xl hover:bg-stone-200 text-stone-400">✏️</button>
                      <button onClick={() => delIng(ing)} className="p-2 rounded-2xl hover:bg-red-50 text-stone-400">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== CATEGORIES TAB ==================== */}
      {activeTab === "categories" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => openCat()} className="btn-primary">+ Kategori Ekle 📁</button>
          </div>
          {categories.length === 0 ? (
            <div className="card text-center py-16">
              <span className="text-6xl">📁</span>
              <h3 className="text-xl font-bold text-stone-800 mt-5">Henüz kategori yok</h3>
              <p className="text-base text-stone-400 mt-2 mb-6">Mezeler, Ana Yemekler, Tatlılar gibi kategoriler ekle</p>
              <button onClick={() => openCat()} className="btn-primary">+ Kategori Ekle 📁</button>
            </div>
          ) : (
            <div className="card">
              <div className="space-y-2">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50">
                    <p className="font-semibold text-stone-800">{c.name}</p>
                    <div className="flex gap-1">
                      <button onClick={() => openCat(c)} className="p-2 rounded-2xl hover:bg-stone-200 text-stone-400">✏️</button>
                      <button onClick={() => delCat(c)} className="p-2 rounded-2xl hover:bg-red-50 text-stone-400">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== INGREDIENT MODAL ==================== */}
      {showIngModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowIngModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-display font-bold mb-5">{editingIng ? "Malzeme Düzenle ✏️" : "Yeni Malzeme 🧅"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-2">Malzeme Adı *</label>
                <input type="text" value={ingForm.name} onChange={e => setIngForm({...ingForm, name: e.target.value})} className="input-field" placeholder="Kıyma, Domates, Pirinç..." autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-base font-semibold text-stone-700 mb-2">Birim</label>
                  <select value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})} className="input-field">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-semibold text-stone-700 mb-2">Birim Fiyatı (TL) *</label>
                  <input type="number" step="0.01" min="0" value={ingForm.price_per_unit} onChange={e => setIngForm({...ingForm, price_per_unit: e.target.value})} className="input-field" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowIngModal(false)} className="btn-secondary">İptal</button>
              <button onClick={saveIng} className="btn-primary">{editingIng ? "Güncelle ✅" : "Ekle 🎉"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CATEGORY MODAL ==================== */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowCatModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-display font-bold mb-4">{editingCat ? "Kategori Düzenle ✏️" : "Yeni Kategori 📁"}</h3>
            <input type="text" value={catName} onChange={e => setCatName(e.target.value)} className="input-field mb-5" placeholder="Örn: Ana Yemekler, Tatlılar..." autoFocus onKeyDown={e => e.key === "Enter" && saveCat()} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCatModal(false)} className="btn-secondary">İptal</button>
              <button onClick={saveCat} className="btn-primary">{editingCat ? "Güncelle ✅" : "Ekle 🎉"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RECIPE MODAL ==================== */}
      {showRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowRecipeModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-display font-bold mb-5">{editingRecipe ? "Reçete Düzenle ✏️" : "Yeni Reçete 🍳"}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-stone-700 mb-2">🍽️ Reçete Adı *</label>
                <input type="text" value={recipeForm.name} onChange={e => setRecipeForm({...recipeForm, name: e.target.value})} className="input-field" placeholder="Karnıyarık" autoFocus />
              </div>

              <div>
                <label className="block text-base font-semibold text-stone-700 mb-2">📝 Açıklama</label>
                <textarea value={recipeForm.description} onChange={e => setRecipeForm({...recipeForm, description: e.target.value})} className="input-field resize-none" rows={2} placeholder="Patlıcan, kıyma, domates..." />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-base font-semibold text-stone-700 mb-2">📁 Kategori</label>
                  <select value={recipeForm.category_id} onChange={e => setRecipeForm({...recipeForm, category_id: e.target.value})} className="input-field">
                    <option value="">Seçiniz</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-semibold text-stone-700 mb-2">🍽️ Porsiyon</label>
                  <input type="number" min="1" value={recipeForm.portions} onChange={e => setRecipeForm({...recipeForm, portions: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-base font-semibold text-stone-700 mb-2">💰 Kâr Marjı</label>
                  <input type="number" step="0.1" min="1" value={recipeForm.margin} onChange={e => setRecipeForm({...recipeForm, margin: e.target.value})} className="input-field" />
                  <p className="text-xs text-stone-400 mt-1">×{recipeForm.margin} çarpan</p>
                </div>
              </div>

              {/* Malzeme Listesi */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-base font-semibold text-stone-700">🧅 Malzemeler</label>
                  <button type="button" onClick={addIngToRecipe} className="text-sm text-mango-500 font-bold hover:underline">+ Malzeme Ekle</button>
                </div>

                {ingredients.length === 0 ? (
                  <div className="text-center py-6 bg-stone-50 rounded-2xl">
                    <p className="text-stone-400">Önce Malzemeler sekmesinden malzeme ekle</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipeIngs.map((ri, idx) => {
                      const selectedIng = ingredients.find(i => i.id === ri.ingredientId);
                      const itemCost = selectedIng ? selectedIng.price_per_unit * (parseFloat(ri.amount) || 0) : 0;
                      return (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-stone-50 rounded-2xl">
                          <select
                            value={ri.ingredientId}
                            onChange={e => {
                              const copy = [...recipeIngs];
                              copy[idx].ingredientId = parseInt(e.target.value);
                              setRecipeIngs(copy);
                            }}
                            className="input-field flex-1"
                          >
                            <option value="0">Seçiniz</option>
                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({formatCurrency(i.price_per_unit)}/{i.unit})</option>)}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Miktar"
                            value={ri.amount}
                            onChange={e => {
                              const copy = [...recipeIngs];
                              copy[idx].amount = e.target.value;
                              setRecipeIngs(copy);
                            }}
                            className="input-field w-24"
                          />
                          <span className="text-sm text-stone-400 w-12">{selectedIng?.unit || ""}</span>
                          <span className="text-sm font-bold text-mango-600 w-20 text-right">{formatCurrency(itemCost)}</span>
                          <button onClick={() => removeIngFromRecipe(idx)} className="p-1 text-red-400 hover:text-red-600">✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fiyat Hesaplama Özeti */}
              {recipeIngs.length > 0 && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl">
                  <div className="text-center">
                    <p className="text-xs text-red-500 font-bold uppercase">Maliyet</p>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(getModalCost())}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-mint-600 font-bold uppercase">Satış Fiyatı</p>
                    <p className="text-lg font-bold text-mint-800">{formatCurrency(Math.ceil(getModalCost() * (parseFloat(recipeForm.margin) || 1)))}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-sunshine-700 font-bold uppercase">Porsiyon</p>
                    <p className="text-lg font-bold text-sunshine-900">
                      {formatCurrency(Math.ceil(Math.ceil(getModalCost() * (parseFloat(recipeForm.margin) || 1)) / (parseInt(recipeForm.portions) || 1)))}
                    </p>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={recipeForm.is_active} onChange={e => setRecipeForm({...recipeForm, is_active: e.target.checked})} className="w-5 h-5 rounded-lg border-stone-300 text-mango-500" />
                <span className="text-base text-stone-700 font-medium">Menüde göster 👁️</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRecipeModal(false)} className="btn-secondary">İptal</button>
              <button onClick={saveRecipe} className="btn-primary">{editingRecipe ? "Güncelle ✅" : "Ekle 🎉"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}