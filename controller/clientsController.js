const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getClients: createRpcHandler("get_clientes", "query"),
  getClient: createRpcHandler("get_cliente", "query"),
  setClient: createRpcHandler("set_cliente", "body"),
  getEnderecos: createRpcHandler("get_enderecos", "quey"),
  setEndereco: createRpcHandler("set_endereco", "body"),
  delEndereco: createRpcHandler("del_endereco", "body"),
};
