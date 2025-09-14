// app-despesas.js (padronizado com API.apiFetch + fetchJson)
import { DomUtils, FormatUtils, API, EventUtils } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

/* =========================
 * Wrapper de fetch (JSON)
 * ========================= */
async function fetchJson(url, options) {
  const res = await API.apiFetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json")
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    const msg =
      (body && (body.error || body.message)) ||
      res.statusText ||
      "Erro na requisição";
    throw new Error(msg);
  }
  return body;
}

/* =========================
 * Carregar/Exibir despesas
 * ========================= */
async function fillDespesas() {
  try {
    const data = await fetchJson(`/getDespesas`);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      DomUtils.setText("txt_imposto", "0");
      DomUtils.setText("txt_despesa", FormatUtils.formatCurrencyBR(0));
      DomUtils.setText("txt_dias_produtivos", "0");
      DomUtils.setText("txt_horas", "0");
      DomUtils.setText("txt_qt_equipe", "0");
      return;
    }
    DomUtils.setText(
      "txt_imposto",
      FormatUtils.convertDecimalToPercent(row.p_imposto)
    );
    DomUtils.setText(
      "txt_despesa",
      FormatUtils.formatCurrencyBR(row.p_total_despesa || 0)
    );
    DomUtils.setText("txt_dias_produtivos", row.p_dias_produtivos ?? 0);
    DomUtils.setText("txt_horas", row.p_horas_produtivas ?? 0);
    DomUtils.setText("txt_qt_equipe", row.p_qt_equipe_funcionario ?? 0);
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Ocorreu um erro ao buscar dados.",
    });
  }
}

/* =========================
 * Radios de cálculo
 * ========================= */
function checkRadios() {
  const radios = document.querySelectorAll('input[name="tipo"]');

  const calcular = (modo) => {
    const gastoTotal = FormatUtils.toDecimalStringFromBR(
      DomUtils.getText("txt_despesa")
    );
    const dias = Number(DomUtils.getText("txt_dias_produtivos")) || 1;
    const horas = Number(DomUtils.getText("txt_horas")) || 1;
    const equipe = Number(DomUtils.getText("txt_qt_equipe")) || 1;

    let total = 0;
    if (modo === "equipe") total = gastoTotal / dias / equipe;
    else if (modo === "dia") total = gastoTotal / dias;
    else total = gastoTotal / dias / horas;

    DomUtils.setInnerHtml("lb_valor_total", formatCurrency(total));
  };

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      if (radio.id === "radio-equipe") calcular("equipe");
      else if (radio.id === "radio-dia") calcular("dia");
      else calcular("hora");
    });
  });
}

/* =========================
 * Handlers públicos
 * ========================= */

async function setDespesas() {
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
        DomUtils.getText("txt_imposto")
      ),
      p_total_despesa: FormatUtils.toDecimalStringFromBR(
        DomUtils.getText("txt_despesa")
      ),
      p_dias_produtivos: DomUtils.getText("txt_dias_produtivos"),
      p_horas_produtivas: DomUtils.getText("txt_horas"),
      p_qt_equipe_funcionario: DomUtils.getText("txt_qt_equipe"),
    };

    await fetchJson(`/setDespesas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Alterações salvas com sucesso!",
    });
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
document.addEventListener("DOMContentLoaded", () => {
  fillDespesas();
  checkRadios();
  EventUtils.enableEnterAsTab();
  EventUtils.addEventToElement(
    "#txt_despesa",
    "input",
    FormatUtils.handleCurrencyInputEvent
  );
  EventUtils.addEventToElement("#bt_salvar_calculos", "click", setDespesas);
});
