const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const routes = require("./routes");
const cookieParser = require("cookie-parser");

app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser("s3cr3t!A9$7@#Uihx82&1Zqwe912hjk*&l"));
app.use("/", routes);

app.use((req, res, next) => {
  const id = req.signedCookies?.id || req.cookies?.id;
  if (!id && req.path !== "/index.html" && req.path !== "/") {
    return res.redirect("/index.html");
  }
  next();
});

// ⚠️ Middleware de erro 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

const PORT = 5500;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});
