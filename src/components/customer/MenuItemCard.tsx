import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { Plus, Minus } from "lucide-react";
import type { MenuItemData } from "./MenuContent";

interface Props {
  item: MenuItemData;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const MenuItemCard = ({ item, isExpanded, onToggleExpand }: Props) => {
  const { addItem, items, updateQuantity, removeItem, updateInstructions } = useCart();
  const p = item.menu_item_pricing;
  const [portion, setPortion] = useState<"half" | "full">("half");

  const currentPortion = p?.has_half_full ? portion : "single";
  const cartItem = items.find(
    (i) => i.itemId === item.id && i.portion === currentPortion
  );
  const qty = cartItem?.quantity || 0;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (p?.has_half_full) {
      const price = portion === "half" ? p.half_price! : p.full_price!;
      addItem({ itemId: item.id, name: item.name, portion, price, instructions: "" });
    } else {
      addItem({ itemId: item.id, name: item.name, portion: "single", price: p?.single_price || 0, instructions: "" });
    }
  };

  const handleDecrease = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (qty <= 1) {
      removeItem(item.id, currentPortion);
    } else {
      updateQuantity(item.id, currentPortion, qty - 1);
    }
  };

  const priceDisplay = p?.has_half_full
    ? `₹${p.half_price} / ₹${p.full_price}`
    : `₹${p?.single_price || 0}`;

  return (
    <div
      className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200 cursor-pointer"
      onClick={onToggleExpand}
    >
      {/* Collapsed row */}
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-l-xl bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-2xl">
              🍽
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-between py-2.5 pr-3 min-w-0">
          <div className="flex-1 min-w-0 mr-3">
            <p className="font-medium text-foreground text-sm leading-tight">{item.name}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
            )}
            <p className="text-sm text-primary font-semibold mt-1">{priceDisplay}</p>
          </div>

          {/* Collapsed: show Add button or qty badge */}
          {!isExpanded && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {qty === 0 ? (
                <Button size="sm" className="h-8 px-3 gap-1 text-xs" onClick={(e) => { handleAdd(e); onToggleExpand(); }}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              ) : (
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {qty}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded section */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: isExpanded ? "300px" : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-3 pb-3 pt-2 space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Portion toggle */}
          {p?.has_half_full && (
            <div className="flex gap-2">
              <button
                className={`flex-1 text-xs py-2 rounded-full border font-medium transition-colors ${
                  portion === "half"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}
                onClick={() => setPortion("half")}
              >
                Half — ₹{p.half_price}
              </button>
              <button
                className={`flex-1 text-xs py-2 rounded-full border font-medium transition-colors ${
                  portion === "full"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}
                onClick={() => setPortion("full")}
              >
                Full — ₹{p.full_price}
              </button>
            </div>
          )}

          {/* Instructions input */}
          <Input
            placeholder="Add cooking instructions (e.g. Extra spicy, Less spicy, No onion, Less oil)"
            value={cartItem?.instructions || ""}
            onChange={(e) => updateInstructions(item.id, currentPortion, e.target.value)}
            className="text-xs h-9 rounded-lg"
            maxLength={100}
          />

          {/* Quantity controls */}
          <div className="flex items-center justify-center gap-3">
            {qty > 0 ? (
              <div className="flex items-center gap-2 bg-primary rounded-full px-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-primary-foreground hover:bg-primary/80"
                  onClick={handleDecrease}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold text-primary-foreground w-6 text-center">{qty}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-primary-foreground hover:bg-primary/80"
                  onClick={() => handleAdd()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button className="w-full h-9 rounded-full gap-1 text-xs" onClick={() => handleAdd()}>
                <Plus className="h-3.5 w-3.5" /> Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
