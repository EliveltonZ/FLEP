const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getClients: createRpcHandler("get_clientes", "query"),
};
