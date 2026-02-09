import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const SettingsPanel = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("restaurant_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setName(data.name);
    });
  }, []);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from("restaurant_settings").update({ name: name.trim() }).neq("id", "");
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restaurant Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Restaurant Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={save} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
