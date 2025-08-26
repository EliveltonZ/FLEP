// rpcHandlerFactory.js
const supabase = require("../client/clientSupabase");

/**
 * @param {string} procName                     – nome da função remota no Supabase
 * @param {"query"|"body"} paramSource          – de onde virão os params: req.query ou req.body
 * @param {object}   [opts]
 * @param {string}   [opts.errorMessage]        – texto para enviar ao cliente em caso de falha
 * @param {Function} [opts.transform]           – dado bruto => dado que vai no res.json()
 */
function createRpcHandler(
  procName,
  paramSource = "query",
  { errorMessage, transform } = {}
) {
  return async (req, res) => {
    try {
      const params = paramSource === "body" ? req.body : req.query;
      const { data, error } = await supabase.rpc(procName, params);

      if (error) {
        console.error(`RPC error [${procName}]:`, error);
        return res.status(500).json({
          message: errorMessage || `Erro em ${procName}`,
          error: error.message,
        });
      }

      const payload = transform ? transform(data) : data;
      return res.json(payload);
    } catch (err) {
      console.error(`Erro interno [${procName}]:`, err);
      return res
        .status(500)
        .json({ message: `Erro interno em ${procName}`, error: err.message });
    }
  };
}

module.exports = { createRpcHandler };
