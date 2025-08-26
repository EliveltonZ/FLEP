const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getComissoes: createRpcHandler("get_comissoes", "query"),
  setComissoes: createRpcHandler("set_comissao", "body"),
};
