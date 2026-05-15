import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate } from "../_shared/auth.ts";
import { plaidCall } from "../_shared/plaid.ts";

type ExchangeResponse = { access_token: string; item_id: string };

type LinkMetadata = {
  institution?: { institution_id?: string; name?: string };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authed = await authenticate(req);
  if (authed instanceof Response) return authed;

  let payload: { public_token?: string; metadata?: LinkMetadata };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!payload.public_token) return jsonResponse({ error: "public_token required" }, 400);

  try {
    const exchange = await plaidCall<ExchangeResponse>("/item/public_token/exchange", {
      public_token: payload.public_token,
    });

    const { error } = await authed.serviceClient.from("plaid_items").insert({
      user_id: authed.user.id,
      item_id: exchange.item_id,
      access_token: exchange.access_token,
      institution_id: payload.metadata?.institution?.institution_id ?? null,
      institution_name: payload.metadata?.institution?.name ?? null,
    });
    if (error) throw new Error(error.message);

    return jsonResponse({ ok: true, item_id: exchange.item_id });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
