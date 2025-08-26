const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getTaxasParcelamentos: createRpcHandler("get_taxas", "query"),
  setTaxasParcelamentos: createRpcHandler("set_taxa", "body"),
  setDelTaxasParcelamentos: createRpcHandler("set_del_taxa", "body"),
};
