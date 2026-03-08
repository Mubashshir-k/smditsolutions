import { useState } from "react";
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
  const [localInstructions, setLocalInstructions] = useState("");

  const currentPortion = p?.has_half_full ? portion : "single";
  const cartItem = items.find(
    (i) => i.itemId === item.id && i.portion === currentPortion
  );
  const qty = cartItem?.quantity || 0;

  const currentInstructions = cartItem ? cartItem.instructions : localInstructions;

  const handleInstructionsChange = (value: string) => {
    if (cartItem) {
      updateInstructions(item.id, currentPortion, value);
    } else {
      setLocalInstructions(value);
    }
  };

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (p?.has_half_full) {
      const price = portion === "half" ? p.half_price! : p.full_price!;
      addItem({ itemId: item.id, name: item.name, portion, price, instructions: localInstructions });
    } else {
      addItem({ itemId: item.id, name: item.name, portion: "single", price: p?.single_price || 0, instructions: localInstructions });
    }
    setLocalInstructions("");
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
    <div className="rounded-2xl bg-card text-card-foreground shadow-sm overflow-hidden border border-border">
      {/* Main row: image left, info + button right */}
      <div className="flex cursor-pointer" onClick={onToggleExpand}>
        {/* Square thumbnail */}
        <div className="h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden bg-muted m-3 rounded-xl">
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
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-3xl">
              🍽
            </div>
          )}
        </div>

        {/* Info + controls */}
        <div className="flex flex-1 flex-col justify-between py-3 pr-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground text-base leading-tight">{item.name}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>

          {/* Price + Add button row — anchored at bottom */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-base font-bold text-foreground">{priceDisplay}</p>

            <div onClick={(e) => e.stopPropagation()}>
              {qty === 0 ? (
                <button
                  className="px-5 py-1.5 text-sm font-semibold rounded-lg border-2 border-primary text-primary bg-card hover:bg-primary/5 transition-colors"
                  onClick={(e) => { handleAdd(e); if (!isExpanded) onToggleExpand(); }}
                >
                  ADD +
                </button>
              ) : (
                <div className="flex items-center gap-0.5 rounded-lg border-2 border-primary overflow-hidden">
                  <button
                    className="h-8 w-8 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
                    onClick={handleDecrease}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-bold text-primary w-6 text-center">{qty}</span>
                  <button
                    className="h-8 w-8 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => handleAdd()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: isExpanded ? "400px" : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
          {p?.has_half_full && (
            <div className="flex gap-2">
              <button
                className={`flex-1 text-xs py-2 rounded-full border font-medium transition-colors ${
                  portion === "half"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
                onClick={() => setPortion("half")}
              >
                Half — ₹{p.half_price}
              </button>
              <button
                className={`flex-1 text-xs py-2 rounded-full border font-medium transition-colors ${
                  portion === "full"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
                onClick={() => setPortion("full")}
              >
                Full — ₹{p.full_price}
              </button>
            </div>
          )}

          {item.allow_instructions && (
            <textarea
              placeholder="Add cooking instructions (e.g. Extra spicy, No onion)"
              value={currentInstructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-20 resize-none"
              maxLength={100}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
