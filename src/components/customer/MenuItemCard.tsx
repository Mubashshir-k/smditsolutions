import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Plus } from "lucide-react";
import type { MenuItemData } from "./MenuContent";

interface Props {
  item: MenuItemData;
}

const MenuItemCard = ({ item }: Props) => {
  const { addItem } = useCart();
  const p = item.menu_item_pricing;
  const [portion, setPortion] = useState<"half" | "full">(p?.has_half_full ? "half" : "half");

  const handleAdd = () => {
    if (p?.has_half_full) {
      const price = portion === "half" ? p.half_price! : p.full_price!;
      addItem({ itemId: item.id, name: item.name, portion, price });
    } else {
      addItem({ itemId: item.id, name: item.name, portion: "single", price: p?.single_price || 0 });
    }
  };

  const priceDisplay = p?.has_half_full
    ? `₹${p.half_price} / ₹${p.full_price}`
    : `₹${p?.single_price || 0}`;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="flex-1 min-w-0 mr-3">
          <p className="font-medium text-foreground">{item.name}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
          )}
          <p className="text-sm text-primary font-semibold mt-1">{priceDisplay}</p>
          {p?.has_half_full && (
            <div className="flex gap-2 mt-2">
              <button
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  portion === "half"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}
                onClick={() => setPortion("half")}
              >
                Half
              </button>
              <button
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
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
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAdd}>
          <Plus className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
