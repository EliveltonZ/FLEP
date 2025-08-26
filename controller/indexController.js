const { createRpcHandler } = require("./rpcHandlerFactory");

module.exports = {
  loginDataBase: createRpcHandler("get_user", "query"),
};
