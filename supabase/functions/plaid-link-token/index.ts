import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate } from "../_shared/auth.ts";
import { plaidCall } from "../_shared/plaid.ts";

type LinkTokenResponse = { link_token: string; expiration: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authed = await authenticate(req);
  if (authed instanceof Response) return authed;

  try {
    const data = await plaidCall<LinkTokenResponse>("/link/token/create", {
      client_name: "LockedN",
      user: { client_user_id: authed.user.id },
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
      webhook: Deno.env.get("PLAID_WEBHOOK_URL") ?? undefined,
    });
    return jsonResponse({ link_token: data.link_token, expiration: data.expiration });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
