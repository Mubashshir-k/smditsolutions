import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorUtils";
import { Store, Phone, MapPin, Clock, Receipt, Image } from "lucide-react";

interface Settings {
  name: string;
  phone: string;
  address: string;
  description: string;
  currency_symbol: string;
  opening_hours: string;
  logo_url: string;
    tax_percent: number;
}

const SettingsPanel = () => {
  const [settings, setSettings] = useState<Settings>({
    name: "",
    phone: "",
    address: "",
    description: "",
    currency_symbol: "₹",
    opening_hours: "",
    logo_url: "",
    tax_percent: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("restaurant_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) {
        setSettings({
          name: data.name || "",
          phone: (data as any).phone || "",
          address: (data as any).address || "",
          description: (data as any).description || "",
          currency_symbol: (data as any).currency_symbol || "₹",
          opening_hours: (data as any).opening_hours || "",
          logo_url: (data as any).logo_url || "",
          tax_percent: (data as any).tax_percent || 0,
        });
      }
    });
  }, []);

  const update = (field: keyof Settings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("restaurant_settings")
      .update({
        name: settings.name.trim(),
        phone: settings.phone.trim() || null,
        address: settings.address.trim() || null,
        description: settings.description.trim() || null,
        currency_symbol: settings.currency_symbol.trim() || "₹",
        opening_hours: settings.opening_hours.trim() || null,
        logo_url: settings.logo_url.trim() || null,
        tax_percent: Number(settings.tax_percent) || 0,
      } as any)
      .neq("id", "");
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } else {
      toast({ title: "Settings saved successfully!" });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> Basic Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Restaurant Name</Label>
            <Input value={settings.name} onChange={(e) => update("name", e.target.value)} placeholder="My Restaurant" />
          </div>
          <div className="space-y-2">
            <Label>Description / Tagline</Label>
            <Textarea
              value={settings.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Authentic Indian cuisine since 1990..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Logo URL</Label>
            <Input value={settings.logo_url} onChange={(e) => update("logo_url", e.target.value)} placeholder="https://example.com/logo.png" />
            {settings.logo_url && (
              <img
                src={settings.logo_url}
                alt="Logo preview"
                className="h-16 w-16 rounded-lg object-contain border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Contact & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
            <Input value={settings.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={settings.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="123 Main Street, City, State - 560001"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Opening Hours</Label>
            <Input
              value={settings.opening_hours}
              onChange={(e) => update("opening_hours", e.target.value)}
              placeholder="Mon–Sat: 11am – 11pm, Sun: 12pm – 10pm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Input value={settings.currency_symbol} onChange={(e) => update("currency_symbol", e.target.value)} placeholder="₹" />
            </div>
            <div className="space-y-2">
              <Label>Tax %</Label>
              <Input
                type="number"
                value={settings.tax_percent}
                onChange={(e) => update("tax_percent", Number(e.target.value))}
                min={0}
                max={100}
                placeholder="5"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Tax will be applied to all orders at checkout</p>
        </CardContent>
      </Card>

      <Separator />

      <Button onClick={save} disabled={loading} className="w-full sm:w-auto px-8">
        {loading ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
};

export default SettingsPanel;
