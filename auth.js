(() => {
  const cfg = window.LOCKEDN_CONFIG || {};
  const isConfigured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);

  let client = null;
  if (isConfigured && window.supabase?.createClient) {
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  const setNotice = (el, message) => {
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
  };

  const oauthRedirect = () => {
    const base = window.location.origin;
    const next = cfg.postSignInRedirect || "/link.html";
    return base + next;
  };

  const signInWithProvider = async (provider, noticeEl) => {
    if (!client) {
      setNotice(
        noticeEl,
        "Sign-in is not yet wired to a backend. Fill in supabaseUrl + supabaseAnonKey in config.js."
      );
      return;
    }
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: oauthRedirect() },
    });
    if (error) setNotice(noticeEl, error.message);
  };

  const signOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    window.location.href = "/";
  };

  const getUser = async () => {
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data?.user || null;
  };

  const reflectAuthState = async () => {
    const user = await getUser();
    document.querySelectorAll("[data-auth-when='signed-in']").forEach((el) => {
      el.hidden = !user;
    });
    document.querySelectorAll("[data-auth-when='signed-out']").forEach((el) => {
      el.hidden = Boolean(user);
    });
    document.querySelectorAll("[data-auth-email]").forEach((el) => {
      if (user?.email) el.textContent = user.email;
    });
  };

  const accessToken = async () => {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session?.access_token || null;
  };

  const launchPlaidLink = async (noticeEl, statusEl) => {
    if (!cfg.plaidLinkTokenEndpoint || !cfg.plaidExchangeEndpoint) {
      setNotice(
        noticeEl,
        "Bank linking is not yet wired. Deploy the Plaid edge functions and set their URLs in config.js."
      );
      return;
    }
    if (!window.Plaid?.create) {
      setNotice(noticeEl, "Plaid Link script failed to load. Check your network.");
      return;
    }
    const token = await accessToken();
    if (!token) {
      setNotice(noticeEl, "Please sign in first.");
      return;
    }
    setNotice(statusEl, "Preparing secure connection…");
    let linkToken;
    try {
      const res = await fetch(cfg.plaidLinkTokenEndpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`link_token request failed (${res.status})`);
      ({ link_token: linkToken } = await res.json());
    } catch (err) {
      setNotice(noticeEl, err.message);
      setNotice(statusEl, "");
      return;
    }
    setNotice(statusEl, "");
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: async (publicToken, metadata) => {
        setNotice(statusEl, "Linking account…");
        try {
          const res = await fetch(cfg.plaidExchangeEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ public_token: publicToken, metadata }),
          });
          if (!res.ok) throw new Error(`exchange failed (${res.status})`);
          setNotice(statusEl, "Account linked. You're locked in.");
        } catch (err) {
          setNotice(noticeEl, err.message);
          setNotice(statusEl, "");
        }
      },
      onExit: (err) => {
        if (err) setNotice(noticeEl, err.display_message || err.error_message || "Link cancelled.");
      },
    });
    handler.open();
  };

  window.LockedNAuth = {
    isConfigured,
    signInWithGoogle: (notice) => signInWithProvider("google", notice),
    signInWithApple: (notice) => signInWithProvider("apple", notice),
    signOut,
    getUser,
    reflectAuthState,
    launchPlaidLink,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reflectAuthState);
  } else {
    reflectAuthState();
  }
})();
