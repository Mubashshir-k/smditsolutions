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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const { toast } = useToast();

  const placeOrder = async () => {
    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("create-order", {
      body: {
        table_number: tableNumber,
        items: items.map((item) => ({
          menu_item_id: item.itemId,
          portion: item.portion,
          quantity: item.quantity,
          instructions: item.instructions,
        })),
      },
    });

    if (error || data?.error) {
      toast({
        title: "Error placing order",
        description: data?.error || "An error occurred. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      setConfirmOpen(false);
      return;
    }

    clearCart();
    setConfirmOpen(false);
    setSheetOpen(false);
    setSubmitting(false);
    setCustomerName("");
    setCustomerPhone("");
    onOrderPlaced();
  };

  return (
    <>
      {/* Floating cart icon — top right */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button className="fixed top-2 right-4 z-50 flex items-center justify-center bg-primary text-primary-foreground rounded-xl h-10 w-10 shadow-lg">
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2.5 -right-3 bg-accent text-accent-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            </div>
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

      {/* Sticky bottom View Order bar */}
      {itemCount > 0 && !sheetOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-5">
          <div className="max-w-3xl mx-auto">
            <button
              className="w-full flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground rounded-2xl shadow-[0_4px_24px_hsl(0_65%_35%/0.45)]"
              onClick={() => setSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary-foreground/20 rounded-lg p-1.5">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-base block leading-tight">View Order</span>
                  <span className="text-xs opacity-80">{itemCount} item{itemCount > 1 ? "s" : ""}</span>
                </div>
              </div>
              <span className="font-bold text-lg bg-primary-foreground/20 px-4 py-1.5 rounded-xl">₹{total}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Confirm Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            {/* Customer info fields (optional) */}
            <div className="space-y-3 bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Details (Optional)</p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-9 h-10 rounded-lg bg-background"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Phone number"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-9 h-10 rounded-lg bg-background"
                />
              </div>
            </div>

            {/* Order summary */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Order Summary — Table {tableNumber}</p>
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
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">₹{total}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Go Back
            </Button>
            <Button className="flex-1 rounded-xl" onClick={placeOrder} disabled={submitting}>
              {submitting ? "Placing..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartBar;
