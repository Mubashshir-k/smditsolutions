import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/hooks/useCart";
import MenuContent from "@/components/customer/MenuContent";
import CartBar from "@/components/customer/CartBar";
import OrderSuccess from "@/components/customer/OrderSuccess";
import { AlertCircle } from "lucide-react";

const CustomerMenu = () => {
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Restaurant");

  useEffect(() => {
    const validate = async () => {
      if (!tableParam || isNaN(Number(tableParam))) {
        setInvalid(true);
        setValidating(false);
        return;
      }

      const num = Number(tableParam);
      const { data } = await supabase
        .from("tables")
        .select("table_number")
        .eq("table_number", num)
        .maybeSingle();

      if (!data) {
        setInvalid(true);
      } else {
        setTableNumber(num);
      }
      setValidating(false);
    };

    validate();

    supabase
      .from("public_restaurant_settings" as any)
      .select("name")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.name) setRestaurantName(data.name);
      });
  }, [tableParam]);

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (invalid || tableNumber === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <AlertCircle className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Invalid Table</h2>
        <p className="text-muted-foreground max-w-xs">
          Please scan the QR code on your table to continue.
        </p>
      </div>
    );
  }

  if (orderPlaced) {
    return <OrderSuccess tableNumber={tableNumber} onNewOrder={() => setOrderPlaced(false)} />;
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-sm px-4 py-3 pr-24">
          <h1 className="text-lg font-bold text-foreground">{restaurantName}</h1>
          <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
        </header>
        <MenuContent />
        <CartBar tableNumber={tableNumber} onOrderPlaced={() => setOrderPlaced(true)} />
      </div>
    </CartProvider>
  );
};

export default CustomerMenu;
