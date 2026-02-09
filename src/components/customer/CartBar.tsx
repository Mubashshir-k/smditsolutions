import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  tableNumber: number;
  onOrderPlaced: () => void;
}

const CartBar = ({ tableNumber, onOrderPlaced }: Props) => {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  if (itemCount === 0) return null;

  const placeOrder = async () => {
    setSubmitting(true);

    // Check if table has active order
    const { data: table } = await supabase
      .from("tables")
      .select("active_order_id")
      .eq("table_number", tableNumber)
      .single();

    if (table?.active_order_id) {
      toast({
        title: "Order in progress",
        description: "Your table already has an active order. Please wait for it to complete.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ table_number: tableNumber, total, status: "pending" })
      .select("id")
      .single();

    if (orderError || !order) {
      toast({ title: "Error placing order", description: orderError?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      item_name: item.name,
      portion: item.portion,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      toast({ title: "Error", description: itemsError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Lock table
    await supabase.from("tables").update({ active_order_id: order.id }).eq("table_number", tableNumber);

    clearCart();
    setOpen(false);
    setSubmitting(false);
    onOrderPlaced();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm shadow-lg">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">Table {tableNumber}</span>
            </div>
            <span className="font-bold text-foreground text-lg">₹{total}</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Your Order — Table {tableNumber}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={`${item.itemId}-${item.portion}`}
                className="flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.portion !== "single" && (
                    <p className="text-xs text-muted-foreground capitalize">{item.portion}</p>
                  )}
                  <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.itemId, item.portion, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.itemId, item.portion, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeItem(item.itemId, item.portion)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="font-bold text-lg">Total: ₹{total}</span>
              <Button onClick={placeOrder} disabled={submitting} className="px-6">
                {submitting ? "Placing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CartBar;
