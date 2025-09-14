import {
  getText,
  setText,
  setInnerHtml,
  convertDecimal,
  formatCurrency,
  formatValueDecimal,
  changeFormatCurrency,
  enableEnterAsTab,
  addEventToElement,
  getCookie,
} from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function fillDespesas() {
  const response = await fetch(`/getDespesas`);

  if (!response.ok) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Ocorreu um erro a buscar dados",
    });
  } else {
    const data = await response.json();
    setText("txt_imposto", convertDecimal(data[0].p_imposto));
    setText("txt_despesa", formatCurrency(data[0].p_total_despesa));
    setText("txt_dias_produtivos", data[0].p_dias_produtivos);
    setText("txt_horas", data[0].p_horas_produtivas);
    setText("txt_qt_equipe", data[0].p_qt_equipe_funcionario);
  }
}

function checkRadios() {
  const radios = document.querySelectorAll('input[name="tipo"]');

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        const gastototal = formatValueDecimal(getText("txt_despesa"));
        const diasProdutivos = getText("txt_dias_produtivos");
        const horas = getText("txt_horas");
        const equipe = getText("txt_qt_equipe");
        if (radio.id == "radio-equipe") {
          let total = gastototal / diasProdutivos / equipe;
          setInnerHtml("lb_valor_total", formatCurrency(total));
        } else if (radio.id == "radio-dia") {
          let total = gastototal / diasProdutivos;
          setInnerHtml("lb_valor_total", formatCurrency(total));
        } else {
          let total = gastototal / diasProdutivos / horas;
          setInnerHtml("lb_valor_total", formatCurrency(total));
        }
      }
    });
  });
}

window.formatarMoeda = function (e) {
  changeFormatCurrency(e);
};

window.setDespesas = async function () {
  const result = await Swal.fire({
    icon: "question",
    title: "Alterar",
    text: "Deseja salvar Alterações ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Salvar",
  });

  if (result.isConfirmed) {
    try {
      const data = {
        p_imposto: formatValueDecimal(getText("txt_imposto")),
        p_total_despesa: formatValueDecimal(getText("txt_despesa")),
        p_dias_produtivos: getText("txt_dias_produtivos"),
        p_horas_produtivas: getText("txt_horas"),
        p_qt_equipe_funcionario: getText("txt_qt_equipe"),
      };
      const response = await fetch("/setDespesas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      Swal.fire({
        icon: "success",
        title: "SUCESSO",
        text: "Alterações salvas com Sucesso !!!",
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Ocorreu salvar dados",
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", (event) => {
  fillDespesas();
  checkRadios();
  enableEnterAsTab();
  addEventToElement("#txt_despesa", "input", changeFormatCurrency);
});
