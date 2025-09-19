// app-despesas.js (refatorado e padronizado)
import { DomUtils, FormatUtils, API, EventUtils } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

/* =========================
 * Constantes / Selectors
 * ========================= */
const SEL = {
  TXT_IMPOSTO: "#txt_imposto",
  TXT_DESPESA: "#txt_despesa",
  TXT_DIAS: "#txt_dias_produtivos",
  TXT_HORAS: "#txt_horas",
  TXT_EQUIPE: "#txt_qt_equipe",
  LB_VALOR_TOTAL: "#lb_valor_total",

  RADIO_TIPO: 'input[name="tipo"]',
  R_EQUIPE: "#radio-equipe",
  R_DIA: "#radio-dia",
  R_HORA: "#radio-hora",

  BT_SALVAR: "#bt_salvar_calculos",
};

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
  getDespesas: () => fetchJson(`/getDespesas`),
  setDespesas: (payload) =>
    fetchJson(`/setDespesas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

/* =========================
 * Helpers numéricos
 * ========================= */
const toNumber = (v) => {
  if (v == null) return 0;
  // aceita BRL em string; se já vier decimal, a função debaixo trata
  return Number(FormatUtils.toDecimalStringFromBR(String(v))) || 0;
};
const clampPositive = (n, fallback = 0) =>
  Number.isFinite(n) && n >= 0 ? n : fallback;

/* =========================
 * Cálculo (puro)
 * ========================= */
function calcularRateio({ modo, gastoTotal, dias, horas, equipe }) {
  const _gasto = clampPositive(toNumber(gastoTotal), 0);
  const _dias = clampPositive(Number(dias), 1) || 1;
  const _horas = clampPositive(Number(horas), 1) || 1;
  const _eqp = clampPositive(Number(equipe), 1) || 1;

  if (modo === "equipe") return _gasto / _dias / _eqp;
  if (modo === "dia") return _gasto / _dias;
  // default: hora
  return _gasto / _dias / _horas;
}

/* =========================
 * Serviços (carregar e render)
 * ========================= */
async function fillDespesas() {
  try {
    const data = await api.getDespesas();
    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      // defaults
      DomUtils.setText(SEL.TXT_IMPOSTO, "0");
      DomUtils.setText(SEL.TXT_DESPESA, FormatUtils.formatCurrencyBR(0));
      DomUtils.setText(SEL.TXT_DIAS, "0");
      DomUtils.setText(SEL.TXT_HORAS, "0");
      DomUtils.setText(SEL.TXT_EQUIPE, "0");
      return;
    }

    DomUtils.setText(
      SEL.TXT_IMPOSTO,
      FormatUtils.convertDecimalToPercent(row.p_imposto)
    );
    DomUtils.setText(
      SEL.TXT_DESPESA,
      FormatUtils.formatCurrencyBR(row.p_total_despesa || 0)
    );
    DomUtils.setText(SEL.TXT_DIAS, row.p_dias_produtivos ?? 0);
    DomUtils.setText(SEL.TXT_HORAS, row.p_horas_produtivas ?? 0);
    DomUtils.setText(SEL.TXT_EQUIPE, row.p_qt_equipe_funcionario ?? 0);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Ocorreu um erro ao buscar dados.",
    });
  }
}

/* =========================
 * Controle (radios & recálculo)
 * ========================= */
function getModoAtual() {
  const rEquipe = document.querySelector(SEL.R_EQUIPE);
  const rDia = document.querySelector(SEL.R_DIA);
  // se nada marcado, padrão hora
  if (rEquipe?.checked) return "equipe";
  if (rDia?.checked) return "dia";
  return "hora";
}

function recalcUI() {
  const modo = getModoAtual();
  const total = calcularRateio({
    modo,
    gastoTotal: DomUtils.getText(SEL.TXT_DESPESA),
    dias: DomUtils.getText(SEL.TXT_DIAS),
    horas: DomUtils.getText(SEL.TXT_HORAS),
    equipe: DomUtils.getText(SEL.TXT_EQUIPE),
  });
  DomUtils.setInnerHtml(
    SEL.LB_VALOR_TOTAL,
    FormatUtils.formatCurrencyBR(total)
  );
}

function bindRadiosCalculo() {
  const radios = document.querySelectorAll(SEL.RADIO_TIPO);
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      recalcUI();
    });
  });
}

/* =========================
 * Handler: salvar
 * ========================= */
async function onSalvarDespesas() {
  const confirm = await Swal.fire({
    icon: "question",
    title: "Alterar",
    text: "Deseja salvar alterações?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Salvar",
  });
  if (!confirm.isConfirmed) return;

  try {
    const payload = {
      p_imposto: FormatUtils.toDecimalStringFromBR(
        DomUtils.getText(SEL.TXT_IMPOSTO)
      ),
      p_total_despesa: FormatUtils.toDecimalStringFromBR(
        DomUtils.getText(SEL.TXT_DESPESA)
      ),
      p_dias_produtivos: DomUtils.getText(SEL.TXT_DIAS),
      p_horas_produtivas: DomUtils.getText(SEL.TXT_HORAS),
      p_qt_equipe_funcionario: DomUtils.getText(SEL.TXT_EQUIPE),
    };

    await api.setDespesas(payload);

    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Alterações salvas com sucesso!",
    });
    // opcional: recarregar valores do servidor
    // await fillDespesas();
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: e.message || "Erro ao salvar dados.",
    });
  }
}

/* =========================
 * Init
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  await fillDespesas();

  // Binds
  bindRadiosCalculo();
  EventUtils.enableEnterAsTab?.();

  // Currency mask/format live
  EventUtils.addEventToElement(
    SEL.TXT_DESPESA,
    "input",
    FormatUtils.handleCurrencyInputEvent
  );

  // Recalcular ao alterar qualquer input relevante
  [SEL.TXT_DESPESA, SEL.TXT_DIAS, SEL.TXT_HORAS, SEL.TXT_EQUIPE].forEach(
    (sel) => {
      EventUtils.addEventToElement(sel, "input", recalcUI);
      EventUtils.addEventToElement(sel, "change", recalcUI);
    }
  );

  // Botão salvar
  EventUtils.addEventToElement(SEL.BT_SALVAR, "click", onSalvarDespesas);

  // 1º cálculo com estado atual
  recalcUI();
});
