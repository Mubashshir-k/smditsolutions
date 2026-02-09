import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  tableNumber: number;
  onNewOrder: () => void;
}

const OrderSuccess = ({ tableNumber, onNewOrder }: Props) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <CheckCircle2 className="h-20 w-20 text-success mb-6" />
      <h2 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h2>
      <p className="text-muted-foreground max-w-xs mb-1">
        Table {tableNumber}
      </p>
      <p className="text-muted-foreground max-w-xs mb-8">
        Please relax, your food is being prepared.
      </p>
      <Button variant="outline" onClick={onNewOrder}>
        View Menu Again
      </Button>
    </div>
  );
};

export default OrderSuccess;
