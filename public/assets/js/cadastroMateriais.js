// app-materiais-categorias.js (refatorado)
import { FormatUtils, EventUtils, DomUtils, API } from "./utils.js";
import { enableTableFilterSort } from "./filtertable.js";
import Swal from "./sweetalert2.esm.all.min.js";

/* =========================
 * Seletores centralizados
 * ========================= */
const SEL = {
  // tables
  T_CATEGORIAS: "#ctable",
  T_CATEGORIAS_TBODY: "#ctable tbody",
  T_MATERIAIS: "#mtable",
  T_MATERIAIS_TBODY: "#mtable tbody",

  // inputs categorias
  IN_CAT_ID: "#cod_categoria",
  IN_CAT_DESC: "#desc_categoria",

  // inputs materiais
  IN_MAT_DESC: "#desc_material",
  IN_MAT_UNID: "#unid_material",
  IN_MAT_PRECO: "#preco_material",
  IN_MAT_CAT: "#cat_material",
  IN_MAT_ID: "#cod_material",

  // botões
  BT_ADD_MAT: "#bt_new_material",
  BT_ADD_CAT: "#bt_new_category",
};

/* =========================
 * Helpers DOM (seguros)
 * ========================= */
const q = (sel, root = document) => root.querySelector(sel);
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  const { dataset, style, className, ...rest } = props || {};
  Object.assign(node, rest);
  if (className) node.className = className;
  if (style) {
    if (typeof style === "string") node.setAttribute("style", style);
    else Object.assign(node.style, style);
  }
  if (dataset) {
    Object.entries(dataset).forEach(([k, v]) => (node.dataset[k] = String(v)));
  }
  (children || []).forEach((c) =>
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return node;
};
const tdCenter = (text) =>
  el("td", { style: { textAlign: "center" } }, [String(text)]);

/* =========================
 * Wrapper de fetch (JSON)
 * ========================= */
async function fetchJson(url, options) {
  try {
    const res = await API.apiFetch(url, options);
    const ct = res.headers.get("content-type") || "";
    let body;
    if (ct.includes("application/json")) {
      body = await res.json();
    } else {
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }
    if (!res.ok) {
      const msg =
        body?.error ||
        body?.message ||
        body?.raw ||
        res.statusText ||
        "Erro na requisição";
      throw new Error(msg);
    }
    return body;
  } catch (err) {
    console.error("fetchJson:", url, err);
    throw err;
  }
}

/* =========================
 * Camada de API
 * ========================= */
const api = {
  getMateriais: () => fetchJson(`/fillTableMateriais`),
  getCategorias: () => fetchJson(`/fillTableCategorias`),
  setCategoria: (payload) =>
    fetchJson(`/setCategoria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  setMateriais: (payload) =>
    fetchJson(`/setMateriais`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

/* =========================
 * Render
 * ========================= */
function renderMateriaisTable(items) {
  const tbody = q(SEL.T_MATERIAIS_TBODY);
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();

  (items || []).forEach((it) => {
    const tr = el("tr", {}, [
      tdCenter(it.p_id_material),
      el("td", {}, [it.p_descricao]),
      tdCenter(it.p_unidade),
      tdCenter(FormatUtils.formatCurrencyBR(it.p_preco)),
    ]);
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function renderCategoriasTable(items) {
  const tbody = q(SEL.T_CATEGORIAS_TBODY);
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();

  (items || []).forEach((it) => {
    const tr = el("tr", {}, [
      tdCenter(it.p_cod_categoria),
      el("td", {}, [it.p_descricao]),
    ]);
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function renderCategoriasOptions(items) {
  const select = document.querySelector(SEL.IN_MAT_CAT);
  // quando DomUtils.setText/getText usa id sem '#', segue esse padrão
  const elSelect =
    typeof select === "string" ? document.getElementById(select) : select;
  if (!elSelect) return;

  elSelect.innerHTML = `<option value="">Selecione a categoria</option>`;
  (items || []).forEach((it) => {
    const opt = el("option", { value: it.p_cod_categoria }, [it.p_descricao]);
    elSelect.appendChild(opt);
  });
}

/* =========================
 * Serviços (loaders)
 * ========================= */
async function loadMateriais() {
  try {
    const data = await api.getMateriais();
    renderMateriaisTable(data);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Não foi possível carregar materiais.",
    });
  }
}

async function loadCategorias({ updateSelect = true } = {}) {
  try {
    const data = await api.getCategorias();
    console.log(data);
    renderCategoriasTable(data);
    if (updateSelect) renderCategoriasOptions(data);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Não foi possível carregar categorias.",
    });
  }
}

/* =========================
 * Controladores
 * ========================= */
async function onSetCategoria() {
  const idCategoria = DomUtils.getText(SEL.IN_CAT_ID);
  const categoria = DomUtils.getText(SEL.IN_CAT_DESC);

  if (!idCategoria || !categoria) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Preencha os campos em branco.",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir nova Categoria?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });
  if (!result.isConfirmed) return;

  try {
    await api.setCategoria({
      p_id_categoria: idCategoria,
      p_categoria: categoria.toUpperCase(),
    });

    await Promise.all([loadCategorias({ updateSelect: true })]);
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Categoria inserida com sucesso!",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Houve um problema ao salvar os dados.",
    });
  }
}

async function onSetMateriais() {
  const descricao = DomUtils.getText(SEL.IN_MAT_DESC);
  const unidade = DomUtils.getText(SEL.IN_MAT_UNID);
  const precoRaw = DomUtils.getText(SEL.IN_MAT_PRECO); // pode vir BRL
  const categoria = DomUtils.getText(SEL.IN_MAT_CAT);
  const codigo = DomUtils.getText(SEL.IN_MAT_ID);

  if (!descricao || !unidade || !precoRaw || !categoria || !codigo) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Todos os campos devem ser preenchidos antes de inserir!",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir o novo material?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });
  if (!result.isConfirmed) return;

  try {
    const payload = {
      p_descricao: descricao,
      p_unidade: unidade,
      p_preco: FormatUtils.toDecimalStringFromBR(precoRaw),
      p_id_categoria: categoria,
      p_id_material: codigo,
    };

    await api.setMateriais(payload);

    await loadMateriais();
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Material inserido com sucesso!",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Não foi possível inserir material.",
    });
  }
}

/* =========================
 * Init
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadMateriais(), loadCategorias({ updateSelect: true })]);

  // efeitos/filtros
  EventUtils.tableHover("ctable");
  EventUtils.tableHover("mtable");
  enableTableFilterSort("ctable");
  enableTableFilterSort("mtable");

  // binds
  EventUtils.addEventToElement(SEL.BT_ADD_MAT, "click", onSetMateriais);
  EventUtils.addEventToElement(SEL.BT_ADD_CAT, "click", onSetCategoria);

  // máscara de moeda no input de preço (se houver handler utilitário)
  EventUtils.addEventToElement(
    SEL.IN_MAT_PRECO,
    "input",
    FormatUtils.handleCurrencyInputEvent
  );
});
