import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Plus, Minus } from "lucide-react";
import type { MenuItemData } from "./MenuContent";

interface Props {
  item: MenuItemData;
}

const MenuItemCard = ({ item }: Props) => {
  const { addItem, items, updateQuantity, removeItem } = useCart();
  const p = item.menu_item_pricing;
  const [portion, setPortion] = useState<"half" | "full">("half");

  const cartItem = items.find(
    (i) => i.itemId === item.id && (p?.has_half_full ? i.portion === portion : i.portion === "single")
  );
  const qty = cartItem?.quantity || 0;

  const handleAdd = () => {
    if (p?.has_half_full) {
      const price = portion === "half" ? p.half_price! : p.full_price!;
      addItem({ itemId: item.id, name: item.name, portion, price });
    } else {
      addItem({ itemId: item.id, name: item.name, portion: "single", price: p?.single_price || 0 });
    }
  };

  const handleDecrease = () => {
    const prt = p?.has_half_full ? portion : "single";
    if (qty <= 1) {
      removeItem(item.id, prt);
    } else {
      updateQuantity(item.id, prt, qty - 1);
    }
  };

  const priceDisplay = p?.has_half_full
    ? `₹${p.half_price} / ₹${p.full_price}`
    : `₹${p?.single_price || 0}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex gap-3 p-0">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-24 w-24 object-cover shrink-0"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex flex-1 items-center justify-between py-3 pr-3 min-w-0" style={!item.image_url ? { paddingLeft: '1rem' } : {}}>
          <div className="flex-1 min-w-0 mr-3">
            <p className="font-medium text-foreground text-sm">{item.name}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
            )}
            <p className="text-sm text-primary font-semibold mt-1">{priceDisplay}</p>
            {p?.has_half_full && (
              <div className="flex gap-1.5 mt-1.5">
                <button
                  className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                    portion === "half"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border"
                  }`}
                  onClick={() => setPortion("half")}
                >
                  Half
                </button>
                <button
                  className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                    portion === "full"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border"
                  }`}
                  onClick={() => setPortion("full")}
                >
                  Full
                </button>
              </div>
            )}
          </div>
          <div className="shrink-0">
            {qty === 0 ? (
              <Button size="sm" className="h-8 px-3 gap-1 text-xs" onClick={handleAdd}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 bg-primary rounded-lg">
                <Button size="icon" className="h-8 w-8 rounded-r-none" onClick={handleDecrease}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="text-sm font-bold text-primary-foreground w-5 text-center">{qty}</span>
                <Button size="icon" className="h-8 w-8 rounded-l-none" onClick={handleAdd}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
