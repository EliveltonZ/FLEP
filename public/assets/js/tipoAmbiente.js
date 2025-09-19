// app-categorias-ambiente.js (padronizado como o app-orcamentos.js)

// =========================
// Imports
// =========================
import { DomUtils, EventUtils, API } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

// =========================
// Constantes / Selectors
// =========================
const SEL = {
  TBODY: "#tbody-ambiente",
  IN_CATEGORIA: "#txt_categoria",
  BT_NOVA_CATEGORIA: "#bt_new_category",
};

// =========================
// Helpers DOM (mínimos)
// =========================
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
  if (dataset && typeof dataset === "object") {
    Object.entries(dataset).forEach(([k, v]) => (node.dataset[k] = String(v)));
  }
  (children || []).forEach((c) =>
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return node;
};
const fragment = () => document.createDocumentFragment();

// =========================
// Fetch wrapper & API
// =========================
async function fetchJson(url, options) {
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
      body?.message || body?.error || body?.raw || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

const api = {
  getCategoriasAmbientes: () => fetchJson(`/getCategoriasAmbientes`),
  setCategoriasAmbientes: (payload) =>
    fetchJson(`/setCategoriasAmbientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

// =========================
// Renderizadores (puros)
// =========================
function renderCategoriasTable(items = []) {
  const tbody = q(SEL.TBODY);
  if (!tbody) return;
  tbody.innerHTML = "";
  const frag = fragment();

  items.forEach((it) => {
    const tr = el("tr");
    tr.append(
      el("td", { textContent: it.p_id_categoria }),
      el("td", { textContent: it.p_categoria })
    );
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

// =========================
// Handlers (controladores)
// =========================
async function onConfirmSetCategoriaAmbiente() {
  const category = DomUtils.getText(SEL.IN_CATEGORIA);
  if (!category) {
    Swal.fire({
      icon: "warning",
      title: "ATENÇÃO",
      text: "Digite a categoria desejada!",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    title: "Nova Categoria",
    text: "Deseja salvar nova categoria de ambiente?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!result.isConfirmed) return;

  try {
    await api.setCategoriasAmbientes({ p_categoria: category.toUpperCase() });
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Categoria inserida com sucesso!",
    });
    await loadCategoriasAmbiente();
    DomUtils.setText(SEL.IN_CATEGORIA, ""); // opcional: limpar campo
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Não foi possível inserir a categoria. ${err.message ?? ""}`.trim(),
    });
  }
}

// =========================
// Loaders
// =========================
async function loadCategoriasAmbiente() {
  try {
    const data = await api.getCategoriasAmbientes();
    renderCategoriasTable(data);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Não foi possível carregar categorias. ${err.message ?? ""}`.trim(),
    });
  }
}

// =========================
// Inicialização
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadCategoriasAmbiente();

  EventUtils.addEventToElement(
    SEL.BT_NOVA_CATEGORIA,
    "click",
    onConfirmSetCategoriaAmbiente
  );
});
