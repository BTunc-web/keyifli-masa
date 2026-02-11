import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("shop_name, shop_description")
    .eq("shop_slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Dükkan Bulunamadı" };
  return {
    title: data.shop_name + " | Keyifli Masa",
    description: data.shop_description || data.shop_name + " - Sipariş",
  };
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("shop_slug", slug)
    .eq("is_active", true)
    .single();

  if (!profile) notFound();

  const [{ data: categories }, { data: recipes }] = await Promise.all([
    supabase.from("categories").select("*").eq("profile_id", profile.id).order("sort_order"),
    supabase.from("recipes").select("*").eq("profile_id", profile.id).eq("is_active", true).order("name"),
  ]);

  return <ShopClient profile={profile} categories={categories || []} recipes={recipes || []} />;
}