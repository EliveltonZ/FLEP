// controller/rpcHandlerFactory.js
const supabase = require("../client/clientSupabase");

/**
 * Extrai o JWT do header Authorization: Bearer <token>
 * ou dos cookies httpOnly (assinados ou não).
 */
function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const [, token] = h.split(" ");
  return (
    token ||
    (req.signedCookies && req.signedCookies.sb_access_token) ||
    (req.cookies && req.cookies.sb_access_token) ||
    null
  );
}

/**
 * Cria um handler para chamar uma RPC do Postgres via Supabase,
 * usando a identidade do usuário (JWT) para o RLS.
 *
 * @param {string} procName - nome da função RPC (ex.: 'set_cliente')
 * @param {'query'|'body'} [paramSource='query'] - de onde ler os parâmetros
 * @param {{ errorMessage?: string, transform?: (data:any)=>any }} [opts]
 * @returns {(req,res)=>Promise<void>}
 */
function createRpcHandler(
  procName,
  paramSource = "query",
  { errorMessage, transform } = {}
) {
  return async (req, res) => {
    try {
      // 1) JWT obrigatório
      const token = getBearerToken(req);
      if (!token) {
        return res
          .status(401)
          .json({
            message: "Não autenticado (JWT ausente)",
            code: "UNAUTHENTICATED",
          });
      }

      // 2) Client autenticado em nome do usuário (RLS usa auth.uid())
      const sb = supabase.withUser(token);

      // 3) Parâmetros
      const rawParams =
        paramSource === "body" ? req.body || {} : req.query || {};

      // Remover compat legado p/ evitar ruído (foi eliminado do schema)
      // Observação: mantemos os demais parâmetros exatamente como vêm.
      // eslint-disable-next-line no-unused-vars
      const { p_id_marcenaria, ...params } = rawParams;

      // 4) Chamada RPC
      const { data, error } = await sb.rpc(procName, params);

      // 5) Erros
      if (error) {
        // Heurística simples para mapear erros de auth/rls em 401
        const msg = (error.message || "").toLowerCase();
        const isAuthErr =
          error.status === 401 ||
          msg.includes("jwt") ||
          msg.includes("authorization") ||
          msg.includes("permission denied") ||
          msg.includes("not authorized") ||
          msg.includes("row-level security");

        if (isAuthErr) {
          return res
            .status(401)
            .json({
              message: "Sessão expirada ou inválida",
              code: "UNAUTHENTICATED",
            });
        }

        // Demais erros: 400
        return res.status(400).json({
          message: errorMessage || `Falha ao executar ${procName}`,
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }

      // 6) OK
      const payload = transform ? transform(data) : data;
      return res.json(payload);
    } catch (err) {
      console.error(`[RPC:${procName}] Erro inesperado:`, err);
      return res.status(500).json({
        message: `Erro interno ao executar ${procName}`,
        error: err.message || String(err),
        code: "INTERNAL_ERROR",
      });
    }
  };
}

module.exports = { createRpcHandler, getBearerToken };
