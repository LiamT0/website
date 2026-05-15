// Backend wiring for LockedN. Fill these in once your Supabase project and
// Plaid edge functions exist. Until they are set, sign-in and bank-link
// buttons show a "not yet configured" notice instead of failing silently.
window.LOCKEDN_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  plaidLinkTokenEndpoint: "",
  plaidExchangeEndpoint: "",
  postSignInRedirect: "/link.html",
};
