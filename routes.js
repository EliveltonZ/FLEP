const express = require("express");
const route = express.Router();
const indexController = require("./controller/indexController");
const orcamentosController = require("./controller/orcamentosController");
const cadastroMateriaisController = require("./controller/cadastroMateriasController");
const taxaParcelamentoController = require("./controller/taxaParcelamentoController");
const clientsController = require("./controller/clientsController");
const tipoAmbienteController = require("./controller/tipoAmbienteController");
const meusDadosController = require("./controller/meusDadosController.js");
const baseCalculosController = require("./controller/baseCalculosController");
const cookieController = require("./controller/cookieController");
const comissoesController = require("./controller/comissoesController");
const AuthController = require("./controller/authController");

// rotas cookie
route.get("/getCookie", cookieController.getCookie);
route.post("/setCookie", cookieController.setCookie);

// rotas index.js
route.get("/loginDataBase", indexController.loginDataBase);
route.post("/logout", indexController.logout);

// rotas orcamentos.js
route.get("/getOrcamentos", orcamentosController.getOrcamentos);
route.get("/fillTableClients", orcamentosController.fillTableClients);
route.get("/getAmbientes", orcamentosController.getAmbientes);
route.post("/setAmbientes", orcamentosController.setAmbientes);
route.post("/setOrcamentos", orcamentosController.setOrcamentos);
route.get(
  "/getCategoriasAmbientes",
  orcamentosController.getCategoriasAmbientes
);
route.post(
  "/getMateriaisambientes",
  orcamentosController.getMateriaisAmbientes
);

route.post(
  "/setMateriaisAmbientes",
  orcamentosController.setMateriaisAmbientes
);
route.get("/fillTableCustos", orcamentosController.fillTableCustos);
route.get("/totalOcamentos", orcamentosController.totalOcamentos);
route.post("/setCustos", orcamentosController.setCustos);
route.post("/delMaterialAmbiente", orcamentosController.delMaterialAmbiente);

// rotas cadastroMateriais.js
route.get(
  "/fillTableMateriais",
  cadastroMateriaisController.fillTableMateriais
);
route.get(
  "/fillTableCategorias",
  cadastroMateriaisController.fillTableCategorias
);
route.post("/setCategoria", cadastroMateriaisController.setCategoria);
route.post("/setMateriais", cadastroMateriaisController.setMateriais);

// rotas taxaParcelamento.js
route.get(
  "/getTaxasParcelamentos",
  taxaParcelamentoController.getTaxasParcelamentos
);
route.post(
  "/setTaxasParcelamentos",
  taxaParcelamentoController.setTaxasParcelamentos
);

route.post(
  "/setDelTaxasParcelamentos",
  taxaParcelamentoController.setDelTaxasParcelamentos
);

// rotas Clientes
route.get("/getClients", clientsController.getClients);
route.get("/getClient", clientsController.getClient);
route.post("/setClient", clientsController.setClient);
route.get("/getEnderecos", clientsController.getEnderecos);
route.post("/setEndereco", clientsController.setEndereco);
route.delete("/delEndereco", clientsController.delEndereco);

// rotas meusDados.js
route.get("/getMeusDados", meusDadosController.getMeusDados);
route.put("/setMeusDados", meusDadosController.setMeusDados);
route.get("/getBancos", meusDadosController.getBancos);
route.post("/setBancos", meusDadosController.setBancos);
route.delete("/setDelBanco", meusDadosController.setDelBanco);

// rotas baseCalculos.js
route.get("/getDespesas", baseCalculosController.getDespesas);
route.put("/setDespesas", baseCalculosController.setDespesas);

// rotas tipoAmbiente.js
route.post(
  "/setCategoriasAmbientes",
  tipoAmbienteController.setCategoriasAmbientes
);

// rotas comissoes.js
route.get("/getComissoes", comissoesController.getComissoes);
route.post("/setComissoes", comissoesController.setComissoes);

// rotas Auth.js
route.get("/auth/check", AuthController.check); // NOVO
route.post("auth/logout", AuthController.logout); // opcional

module.exports = route;
