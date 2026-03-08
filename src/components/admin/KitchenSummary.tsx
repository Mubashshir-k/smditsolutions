import { Card, CardContent } from "@/components/ui/card";

interface OrderItem {
  item_name: string;
  quantity: number;
  portion: string;
}

interface Order {
  id: string;
  status: string;
  order_items?: OrderItem[];
}

interface Props {
  orders: Order[];
}

const KitchenSummary = ({ orders }: Props) => {
  const aggregated = new Map<string, number>();

  orders.forEach((order) => {
    order.order_items?.forEach((item) => {
      const key =
        item.portion !== "single"
          ? `${item.item_name} (${item.portion})`
          : item.item_name;
      aggregated.set(key, (aggregated.get(key) || 0) + item.quantity);
    });
  });

  const sorted = Array.from(aggregated.entries()).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No items to prepare</p>
        <p className="text-sm mt-1">Items will appear here when orders come in</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map(([name, qty]) => (
        <Card key={name} className="border-2">
          <CardContent className="flex items-center justify-between p-5">
            <span className="font-semibold text-base truncate mr-3">{name}</span>
            <span className="text-3xl font-extrabold text-primary tabular-nums shrink-0">
              ×{qty}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KitchenSummary;
