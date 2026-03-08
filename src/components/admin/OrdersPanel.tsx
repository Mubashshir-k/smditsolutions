import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorUtils";
import KitchenSummary from "./KitchenSummary";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ClipboardList, ChefHat, Printer } from "lucide-react";

interface OrderItem {
  id: string;
  item_name: string;
  portion: string;
  quantity: number;
  price: number;
  subtotal: number;
  instructions: string | null;
}

interface Order {
  id: string;
  table_number: number;
  status: string;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}

const statusFlow: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  preparing: "bg-primary text-primary-foreground",
  ready: "bg-success text-success-foreground",
  completed: "bg-muted text-muted-foreground",
};

const OrdersPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<string>("orders");
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: true });
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);

    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const advanceStatus = async (order: Order) => {
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", order.id);

    if (error) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
      return;
    }

    if (nextStatus === "completed") {
      await supabase
        .from("tables")
        .update({ active_order_id: null })
        .eq("table_number", order.table_number);
    }

    fetchOrders();
  };

  const openPrintWindow = (content: string) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print</title>
        <style>
          @page { size: 58mm auto; margin: 2mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            width: 54mm;
            margin: 0 auto;
            padding: 2mm;
          }
          * { word-wrap: break-word; overflow-wrap: break-word; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const buildOrderHtml = (order: Order) => `
    <div style="padding:4px 0;">
      <div style="display:flex;justify-content:space-between;font-weight:bold;">
        <span>Table ${order.table_number}</span>
        <span>[${order.status}]</span>
      </div>
      <div style="font-size:10px;color:#666;">${new Date(order.created_at).toLocaleTimeString()}</div>
      ${order.order_items?.map((item) => `
        <div style="display:flex;justify-content:space-between;font-size:11px;padding:1px 0;">
          <span>${item.quantity}x ${item.item_name}${item.portion !== "single" ? ` (${item.portion})` : ""}</span>
          <span>₹${item.subtotal}</span>
        </div>
        ${item.instructions ? `<div style="font-size:9px;color:#666;padding-left:8px;font-style:italic;">📝 ${item.instructions}</div>` : ""}
      `).join("") || ""}
      <div style="text-align:right;font-weight:bold;padding-top:3px;border-top:1px solid #eee;">Total: ₹${order.total}</div>
    </div>
  `;

  const handlePrint = () => {
    let content = "";
    if (view === "summary") {
      const aggregated = new Map<string, number>();
      orders.forEach((order) => {
        order.order_items?.forEach((item) => {
          const key = item.portion !== "single" ? `${item.item_name} (${item.portion})` : item.item_name;
          aggregated.set(key, (aggregated.get(key) || 0) + item.quantity);
        });
      });
      const sorted = Array.from(aggregated.entries()).sort((a, b) => b[1] - a[1]);
      content = `
        <h2 style="text-align:center;border-bottom:2px solid #000;padding-bottom:4px;margin-bottom:8px;">Kitchen Summary</h2>
        ${sorted.map(([name, qty]) => `
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ccc;">
            <span>${name}</span>
            <strong style="font-size:16px;">×${qty}</strong>
          </div>
        `).join("")}
      `;
    } else {
      content = `
        <h2 style="text-align:center;border-bottom:2px solid #000;padding-bottom:4px;margin-bottom:8px;">Live Orders (${orders.length})</h2>
        ${orders.map((order) => `<div style="border-bottom:1px dashed #000;margin-bottom:6px;">${buildOrderHtml(order)}</div>`).join("")}
      `;
    }
    openPrintWindow(content);
  };

  const handlePrintOrder = (order: Order) => {
    const content = `
      <h2 style="text-align:center;border-bottom:2px solid #000;padding-bottom:4px;margin-bottom:8px;">Order — Table ${order.table_number}</h2>
      ${buildOrderHtml(order)}
    `;
    openPrintWindow(content);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No active orders</p>
        <p className="text-sm mt-1">Orders will appear here when customers place them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="orders-print-area">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Live Orders ({orders.length})</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)} className="border rounded-lg">
            <ToggleGroupItem value="orders" className="gap-1.5 text-xs sm:text-sm px-3">
              <ClipboardList className="h-4 w-4" />
              Individual Orders
            </ToggleGroupItem>
            <ToggleGroupItem value="summary" className="gap-1.5 text-xs sm:text-sm px-3">
              <ChefHat className="h-4 w-4" />
              Kitchen Summary
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {view === "summary" ? (
        <KitchenSummary orders={orders} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Table {order.table_number}</CardTitle>
                <Badge className={statusColors[order.status]}>{order.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="text-sm">
                    <div className="flex justify-between">
                      <span>
                        {item.quantity}x {item.item_name}
                        {item.portion !== "single" && (
                          <span className="text-muted-foreground ml-1">({item.portion})</span>
                        )}
                      </span>
                      <span className="text-muted-foreground">₹{item.subtotal}</span>
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-muted-foreground italic ml-4">📝 {item.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Total: ₹{order.total}</span>
                {statusFlow[order.status] && (
                  <Button size="sm" onClick={() => advanceStatus(order)}>
                    Mark {statusFlow[order.status]}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPanel;
