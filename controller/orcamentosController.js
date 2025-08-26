const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  getOrcamentos: createRpcHandler("get_orcamentos", "query"),
  setOrcamentos: createRpcHandler("set_orcamento", "body"),
  fillTableClients: createRpcHandler("get_clientes", "query"),
  getAmbientes: createRpcHandler("get_ambientes", "query"),
  setAmbientes: createRpcHandler("set_ambiente", "body"),
  getCategoriasAmbientes: createRpcHandler("get_categoriaambientes", "query"),
  getMateriaisAmbientes: createRpcHandler("get_materiaisambiente", "body"),
  setMateriaisAmbientes: createRpcHandler("set_materiaisambiente", "body"),
  fillTableCustos: createRpcHandler("get_custos", "query"),
  totalOcamentos: createRpcHandler("somar_valores", "query"),
  setCustos: createRpcHandler("set_custo", "body"),
  delMaterialAmbiente: createRpcHandler("delete_material_ambiente", "body"),
};
