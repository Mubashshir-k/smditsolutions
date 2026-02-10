import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  tableNumber: number;
  onOrderPlaced: () => void;
}

const CartBar = ({ tableNumber, onOrderPlaced }: Props) => {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const placeOrder = async () => {
    setSubmitting(true);

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
      setConfirmOpen(false);
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ table_number: tableNumber, total, status: "pending" })
      .select("id")
      .single();

    if (orderError || !order) {
      toast({ title: "Error placing order", description: orderError?.message, variant: "destructive" });
      setSubmitting(false);
      setConfirmOpen(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      item_name: item.name,
      portion: item.portion,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      instructions: item.instructions?.trim() || null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      toast({ title: "Error", description: itemsError.message, variant: "destructive" });
      setSubmitting(false);
      setConfirmOpen(false);
      return;
    }

    await supabase.from("tables").update({ active_order_id: order.id }).eq("table_number", tableNumber);

    clearCart();
    setConfirmOpen(false);
    setSheetOpen(false);
    setSubmitting(false);
    onOrderPlaced();
  };

  return (
    <>
      {/* Floating cart button - top right */}
      {itemCount > 0 && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full pl-3 pr-4 py-2 shadow-lg">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-2 -right-2.5 bg-accent text-accent-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              </div>
              <span className="font-semibold text-sm">₹{total}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-left">Your Order — Table {tableNumber}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.itemId}-${item.portion}`}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.portion !== "single" && (
                        <span className="capitalize">{item.portion}</span>
                      )}
                      <span>₹{item.price} × {item.quantity}</span>
                      <span className="font-semibold text-foreground">= ₹{item.price * item.quantity}</span>
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">📝 {item.instructions}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.itemId, item.portion, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
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
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem(item.itemId, item.portion)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">₹{total}</span>
                </div>
                <Button
                  className="w-full h-12 text-base font-semibold"
                  onClick={() => setConfirmOpen(true)}
                >
                  Place Order — ₹{total}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Sticky bottom Continue button */}
      {itemCount > 0 && !sheetOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t px-4 py-3">
          <Button
            className="w-full h-12 text-base font-semibold gap-2"
            onClick={() => setSheetOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            Continue — {itemCount} {itemCount === 1 ? "item" : "items"} • ₹{total}
          </Button>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 my-2">
            <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
            {items.map((item) => (
              <div key={`${item.itemId}-${item.portion}`} className="text-sm">
                <div className="flex justify-between">
                  <span>
                    {item.quantity}× {item.name}
                    {item.portion !== "single" && <span className="text-muted-foreground ml-1">({item.portion})</span>}
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
                {item.instructions && (
                  <p className="text-xs text-muted-foreground italic ml-4">📝 {item.instructions}</p>
                )}
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">₹{total}</span>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Go Back
            </Button>
            <Button className="flex-1" onClick={placeOrder} disabled={submitting}>
              {submitting ? "Placing..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartBar;
