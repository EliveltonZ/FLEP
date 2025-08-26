const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  fillTableMateriais: createRpcHandler("get_materiais", "query"),
  fillTableCategorias: createRpcHandler("get_categoriasmateriais", "query"),
  setCategoria: createRpcHandler("set_categoria", "body"),
  setMateriais: createRpcHandler("set_materiais", "body"),
};
