import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MenuItemCard from "./MenuItemCard";

interface Pricing {
  has_half_full: boolean;
  half_price: number | null;
  full_price: number | null;
  single_price: number | null;
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  available: boolean;
  allow_instructions: boolean;
  category_id: string;
  menu_item_pricing: Pricing | null;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

const MenuContent = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      const [catRes, itemRes] = await Promise.all([
        supabase.from("food_categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*, menu_item_pricing(*)").eq("available", true).order("sort_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (itemRes.data) {
        setItems(
          itemRes.data.map((i: any) => ({
            ...i,
            menu_item_pricing: Array.isArray(i.menu_item_pricing)
              ? i.menu_item_pricing[0] || null
              : i.menu_item_pricing,
          }))
        );
      }
    };
    fetchMenu();
  }, []);

  const handleToggleExpand = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: items.filter((i) => i.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground px-4">
        <p>Menu is being prepared. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      {grouped.map((group) => (
        <section key={group.id}>
          <h2 className="text-lg font-semibold text-foreground mb-3 sticky top-[68px] bg-background py-1 z-10">
            {group.name}
          </h2>
          <div className="space-y-2">
            {group.items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                isExpanded={expandedItemId === item.id}
                onToggleExpand={() => handleToggleExpand(item.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default MenuContent;
