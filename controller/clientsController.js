const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getClients: createRpcHandler("get_clientes", "query"),
  getEnderecos: createRpcHandler("get_enderecos", "quey"),
};
