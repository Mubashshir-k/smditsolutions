import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorUtils";
import { Plus, Trash2, Copy, Link } from "lucide-react";

interface TableRow {
  id: string;
  table_number: number;
  active_order_id: string | null;
}

const TablesPanel = () => {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [newTableNum, setNewTableNum] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTables = async () => {
    const { data } = await supabase.from("tables").select("*").order("table_number");
    if (data) setTables(data);
  };

  useEffect(() => { fetchTables(); }, []);

  const addTable = async () => {
    const num = Number(newTableNum);
    if (!num || num <= 0) {
      toast({ title: "Invalid table number", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("tables").insert({ table_number: num });
    if (error) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } else {
      setNewTableNum("");
      setDialogOpen(false);
      fetchTables();
    }
  };

  const deleteTable = async (table: TableRow) => {
    if (table.active_order_id) {
      toast({ title: "Cannot delete", description: "Table has an active order", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("tables").delete().eq("id", table.id);
    if (error) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } else {
      fetchTables();
    }
  };

  const getTableUrl = (tableNumber: number) => {
    return `${window.location.origin}/menu?table=${tableNumber}`;
  };

  const copyUrl = (tableNumber: number) => {
    navigator.clipboard.writeText(getTableUrl(tableNumber));
    toast({ title: "URL copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tables ({tables.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Table Number</Label>
                <Input
                  type="number"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  min={1}
                  placeholder="e.g. 1"
                />
              </div>
              <Button onClick={addTable} className="w-full">Add Table</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {tables.map((table) => (
          <Card key={table.id}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">Table {table.table_number}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Link className="h-3 w-3" />
                  <span className="truncate">/menu?table={table.table_number}</span>
                </div>
                {table.active_order_id && (
                  <span className="text-xs text-primary font-medium">Active order</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(table.table_number)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTable(table)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tables.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No tables yet. Add tables and share their URLs via QR codes.
          </p>
        )}
      </div>
    </div>
  );
};

export default TablesPanel;
