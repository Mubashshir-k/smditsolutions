import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import MenuItemCard from "./MenuItemCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const fetchMenu = async () => {
      const [catRes, itemRes] = await Promise.all([
        supabase.from("food_categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*, menu_item_pricing(*)").eq("available", true).order("sort_order"),
      ]);
      if (catRes.data) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) setActiveCategory(catRes.data[0].id);
      }
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

  const handleTabClick = useCallback((catId: string) => {
    setActiveCategory(catId);
    const el = sectionRefs.current[catId];
    if (el) {
      isScrollingRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    }
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

  // Update active tab on scroll
  useEffect(() => {
    if (grouped.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.getAttribute("data-cat-id"));
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [grouped.length]);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground px-4">
        <p>Menu is being prepared. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* "Order Now" heading */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Order Now</h1>
      </div>

      {/* Category tabs */}
      <div className="sticky top-[68px] z-20 bg-background border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex gap-1 px-4 py-2">
            {grouped.map((g) => (
              <button
                key={g.id}
                onClick={() => handleTabClick(g.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === g.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>
      </div>

      {/* Menu sections */}
      <div className="px-4 pt-4 space-y-6">
        {grouped.map((group) => (
          <section
            key={group.id}
            ref={(el) => { sectionRefs.current[group.id] = el; }}
            data-cat-id={group.id}
            className="scroll-mt-[120px]"
          >
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {group.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
    </div>
  );
};

export default MenuContent;
