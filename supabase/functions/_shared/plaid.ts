const PLAID_HOSTS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

export const plaidEnv = () => Deno.env.get("PLAID_ENV") ?? "sandbox";

export const plaidBaseUrl = () => PLAID_HOSTS[plaidEnv()] ?? PLAID_HOSTS.sandbox;

export const plaidCredentials = () => {
  const client_id = Deno.env.get("PLAID_CLIENT_ID");
  const secret = Deno.env.get("PLAID_SECRET");
  if (!client_id || !secret) {
    throw new Error("PLAID_CLIENT_ID or PLAID_SECRET not set");
  }
  return { client_id, secret };
};

export const plaidCall = async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
  const res = await fetch(`${plaidBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...plaidCredentials(), ...body }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Plaid ${path} ${res.status}: ${text}`);
  }
  return JSON.parse(text) as T;
};
