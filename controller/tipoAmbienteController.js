const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getCategoriasAmbientes: createRpcHandler("get_categoriaambientes", "query"),
  setCategoriasAmbientes: createRpcHandler("set_categoriaambiente", "body"),
};
