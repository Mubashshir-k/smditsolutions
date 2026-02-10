import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const restaurantName = "SMD IT Solutions";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <UtensilsCrossed className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {restaurantName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Restaurant Management System
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 text-base px-8"
          onClick={() => navigate("/admin/login")}
        >
          <LogIn className="h-5 w-5" />
          Admin Login
        </Button>
      </div>
    </div>
  );
};

export default Index;
