const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getDespesas: createRpcHandler("get_despesas", "query"),
  setDespesas: createRpcHandler("set_despesas", "body"),
};
