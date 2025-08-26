const { createRpcHandler } = require("./rpcHandlerFactory.js");

module.exports = {
  getMeusDados: createRpcHandler("get_meusdados", "query"),
  setMeusDados: createRpcHandler("set_meusdados", "body"),
  getBancos: createRpcHandler("get_bancos", "query"),
  setBancos: createRpcHandler("set_banco", "body"),
  setDelBanco: createRpcHandler("set_delete_banco", "body"),
};
