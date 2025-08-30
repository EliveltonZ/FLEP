const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getClients: createRpcHandler("get_clientes", "query"),
  getClient: createRpcHandler("get_cliente", "query"),
  getEnderecos: createRpcHandler("get_enderecos", "quey"),
};
