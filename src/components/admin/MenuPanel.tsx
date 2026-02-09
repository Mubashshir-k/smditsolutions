import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  image_url: string | null;
  available: boolean;
  allow_instructions: boolean;
  sort_order: number;
  menu_item_pricing: Pricing | null;
}

interface Pricing {
  id: string;
  has_half_full: boolean;
  half_price: number | null;
  full_price: number | null;
  single_price: number | null;
}

const MenuPanel = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [catName, setCatName] = useState("");
  const [catOrder, setCatOrder] = useState("0");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemCat, setItemCat] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);
  const [hasHalfFull, setHasHalfFull] = useState(false);
  const [halfPrice, setHalfPrice] = useState("");
  const [fullPrice, setFullPrice] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  const [allowInstructions, setAllowInstructions] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  const { toast } = useToast();

  const fetchData = async () => {
    const [catRes, itemRes] = await Promise.all([
      supabase.from("food_categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*, menu_item_pricing(*)").order("sort_order"),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (itemRes.data) {
      setItems(
        itemRes.data.map((i: any) => ({
          ...i,
          menu_item_pricing: Array.isArray(i.menu_item_pricing)
            ? i.menu_item_pricing[0] || null
            : i.menu_item_pricing,
        }))
      );
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Category CRUD
  const openCatDialog = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatOrder(String(cat.sort_order));
    } else {
      setEditingCat(null);
      setCatName("");
      setCatOrder("0");
    }
    setCatDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    if (editingCat) {
      await supabase.from("food_categories").update({ name: catName.trim(), sort_order: Number(catOrder) }).eq("id", editingCat.id);
    } else {
      await supabase.from("food_categories").insert({ name: catName.trim(), sort_order: Number(catOrder) });
    }
    setCatDialogOpen(false);
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("food_categories").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchData();
  };

  // Item CRUD
  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemDesc(item.description || "");
      setItemImageUrl(item.image_url || "");
      setItemCat(item.category_id);
      setItemAvailable(item.available);
      const p = item.menu_item_pricing;
      setHasHalfFull(p?.has_half_full || false);
      setHalfPrice(p?.half_price != null ? String(p.half_price) : "");
      setFullPrice(p?.full_price != null ? String(p.full_price) : "");
      setSinglePrice(p?.single_price != null ? String(p.single_price) : "");
    } else {
      setEditingItem(null);
      setItemName("");
      setItemDesc("");
      setItemImageUrl("");
      setItemCat(categories[0]?.id || "");
      setItemAvailable(true);
      setHasHalfFull(false);
      setHalfPrice("");
      setFullPrice("");
      setSinglePrice("");
    }
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    if (!itemName.trim() || !itemCat) return;

    let itemId = editingItem?.id;

    if (editingItem) {
      await supabase.from("menu_items").update({
        name: itemName.trim(),
        description: itemDesc.trim() || null,
        image_url: itemImageUrl.trim() || null,
        category_id: itemCat,
        available: itemAvailable,
      }).eq("id", editingItem.id);
    } else {
      const { data } = await supabase.from("menu_items").insert({
        name: itemName.trim(),
        description: itemDesc.trim() || null,
        image_url: itemImageUrl.trim() || null,
        category_id: itemCat,
        available: itemAvailable,
      }).select("id").single();
      itemId = data?.id;
    }

    if (itemId) {
      const pricingData = {
        menu_item_id: itemId,
        has_half_full: hasHalfFull,
        half_price: hasHalfFull && halfPrice ? Number(halfPrice) : null,
        full_price: hasHalfFull && fullPrice ? Number(fullPrice) : null,
        single_price: !hasHalfFull && singlePrice ? Number(singlePrice) : null,
      };

      const { data: existingPricing } = await supabase
        .from("menu_item_pricing")
        .select("id")
        .eq("menu_item_id", itemId)
        .maybeSingle();

      if (existingPricing) {
        await supabase.from("menu_item_pricing").update(pricingData).eq("id", existingPricing.id);
      } else {
        await supabase.from("menu_item_pricing").insert(pricingData);
      }
    }

    setItemDialogOpen(false);
    fetchData();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id);
    fetchData();
  };

  const toggleAvailability = async (item: MenuItem) => {
    await supabase.from("menu_items").update({ available: !item.available }).eq("id", item.id);
    fetchData();
  };

  const getCategoryName = (catId: string) => categories.find((c) => c.id === catId)?.name || "Unknown";

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categories</h2>
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" onClick={() => openCatDialog()}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCat ? "Edit" : "Add"} Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={catName} onChange={(e) => setCatName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={catOrder} onChange={(e) => setCatOrder(e.target.value)} />
                </div>
                <Button onClick={saveCategory} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-sm">
              <span>{cat.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCatDialog(cat)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCategory(cat.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet</p>}
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" onClick={() => openItemDialog()} disabled={categories.length === 0}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={itemImageUrl} onChange={(e) => setItemImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                  {itemImageUrl && (
                    <img src={itemImageUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={itemCat} onValueChange={setItemCat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={itemAvailable} onCheckedChange={setItemAvailable} />
                  <Label>Available</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={hasHalfFull} onCheckedChange={setHasHalfFull} />
                  <Label>Half/Full Pricing</Label>
                </div>
                {hasHalfFull ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Half Price (₹)</Label>
                      <Input type="number" value={halfPrice} onChange={(e) => setHalfPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Price (₹)</Label>
                      <Input type="number" value={fullPrice} onChange={(e) => setFullPrice(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={singlePrice} onChange={(e) => setSinglePrice(e.target.value)} />
                  </div>
                )}
                <Button onClick={saveItem} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const p = item.menu_item_pricing;
            const priceLabel = p?.has_half_full
              ? `₹${p.half_price} / ₹${p.full_price}`
              : p?.single_price != null
              ? `₹${p.single_price}`
              : "No price";

            return (
              <Card key={item.id} className={!item.available ? "opacity-50" : ""}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{getCategoryName(item.category_id)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{priceLabel}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={item.available} onCheckedChange={() => toggleAvailability(item)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openItemDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No menu items yet. Add categories first, then create items.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPanel;
