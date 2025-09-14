// supabase.js
require("dotenv").config({ path: "./client/.env" });
const { createClient } = require("@supabase/supabase-js");

/**
 * Client ANON (sem usuário) — mantém compatibilidade com seu código atual.
 * Útil para operações públicas. NÃO funciona com RLS se não houver JWT.
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * Cria um client "em nome do usuário" (RLS usa auth.uid()).
 * Use nas rotas que exigem dados do usuário autenticado.
 */
function withUser(accessToken) {
  if (!accessToken) throw new Error("Missing access token (Bearer)");
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Client ADMIN (service role) — bypass RLS. Use somente no backend para tarefas internas.
 */
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
  : null;

// exporta mantendo compat com require('...') que espera um client
module.exports = supabase;
module.exports.withUser = withUser;
module.exports.admin = admin;
