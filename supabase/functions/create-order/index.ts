import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { table_number, items } = await req.json();

    // Validate input
    if (!table_number || !Number.isInteger(table_number) || table_number < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid table number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate table exists (no longer block if active order exists)
    const { data: table } = await supabaseAdmin
      .from("tables")
      .select("table_number, active_order_id")
      .eq("table_number", table_number)
      .single();

    if (!table) {
      return new Response(
        JSON.stringify({ error: "Invalid table" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and price each item server-side
    let total = 0;
    const validatedItems: Array<{
      item_name: string;
      portion: string;
      quantity: number;
      price: number;
      subtotal: number;
      instructions: string | null;
    }> = [];

    for (const item of items) {
      // Validate item structure
      if (!item.menu_item_id || typeof item.menu_item_id !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid item ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return new Response(
          JSON.stringify({ error: "Invalid quantity" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const portion = item.portion || "single";
      if (!["single", "half", "full"].includes(portion)) {
        return new Response(
          JSON.stringify({ error: "Invalid portion type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch menu item + pricing from DB
      const { data: menuItem } = await supabaseAdmin
        .from("menu_items")
        .select("id, name, available, allow_instructions, menu_item_pricing(*)")
        .eq("id", item.menu_item_id)
        .eq("available", true)
        .single();

      if (!menuItem) {
        return new Response(
          JSON.stringify({ error: `Menu item not found or unavailable` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pricing = (menuItem as any).menu_item_pricing?.[0] || (menuItem as any).menu_item_pricing;
      if (!pricing) {
        return new Response(
          JSON.stringify({ error: `No pricing for item: ${menuItem.name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let price: number | null = null;
      if (pricing.has_half_full) {
        if (portion === "half") price = pricing.half_price;
        else if (portion === "full") price = pricing.full_price;
        else {
          return new Response(
            JSON.stringify({ error: `Item "${menuItem.name}" requires half or full portion` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        price = pricing.single_price;
      }

      if (price === null || price === undefined || price < 0) {
        return new Response(
          JSON.stringify({ error: `Invalid price for ${menuItem.name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const subtotal = price * quantity;
      total += subtotal;

      let instructions: string | null = null;
      if (item.instructions && menuItem.allow_instructions) {
        instructions = String(item.instructions).substring(0, 200).trim() || null;
      }

      validatedItems.push({
        item_name: menuItem.name,
        portion,
        quantity,
        price,
        subtotal,
        instructions,
      });
    }

    // Create order with server-validated total
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({ table_number, total, status: "pending" })
      .select("id")
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert validated order items
    const orderItems = validatedItems.map((vi) => ({
      ...vi,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Clean up the order if items fail
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to create order items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update table's active order to the latest
    await supabaseAdmin
      .from("tables")
      .update({ active_order_id: order.id })
      .eq("table_number", table_number);

    return new Response(
      JSON.stringify({ success: true, order_id: order.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
