import {
  getText,
  setText,
  formatCEP,
  setInnerHtml,
  insertButtonCellTable,
  getInnerHtml,
  addEventToElement,
  getCookie,
  setChecked,
  getChecked,
} from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

import { clearTableBody, createRow } from "./dom.js";

function el(tag, text) {
  const node = document.createElement(tag);
  if (text != undefined) node.textContent = text;
  return node;
}

window.findCep = async function () {
  const cep = getText("txt_cep");
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const endereco = await response.json();
  setText("txt_endereco", endereco.logradouro);
  setText("txt_bairro", endereco.bairro);
  setText("txt_cidade", endereco.localidade);
  setText("txt_estado", endereco.uf);
};

function fillStates() {
  const estados = [
    "AC", // Acre
    "AL", // Alagoas
    "AP", // Amapá
    "AM", // Amazonas
    "BA", // Bahia
    "CE", // Ceará
    "DF", // Distrito Federal
    "ES", // Espírito Santo
    "GO", // Goiás
    "MA", // Maranhão
    "MT", // Mato Grosso
    "MS", // Mato Grosso do Sul
    "MG", // Minas Gerais
    "PA", // Pará
    "PB", // Paraíba
    "PR", // Paraná
    "PE", // Pernambuco
    "PI", // Piauí
    "RJ", // Rio de Janeiro
    "RN", // Rio Grande do Norte
    "RS", // Rio Grande do Sul
    "RO", // Rondônia
    "RR", // Roraima
    "SC", // Santa Catarina
    "SP", // São Paulo
    "SE", // Sergipe
    "TO", // Tocantins
  ];
  const select = document.getElementById("txt_estado");
  select.innerHTML = `<option value="-">-</option>`;
  estados.forEach((item) => {
    const option = document.createElement("option");
    option.text = item;
    option.value = item;
    select.appendChild(option);
  });
}

function checkRadios() {
  const radios = document.querySelectorAll('input[name="tipo"]');

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        if (radio.id == "radio-pj") {
          setInnerHtml("lb_nome", "Razão Social: *");
          setInnerHtml("lb_documento", "CNPJ: *");
        } else {
          setInnerHtml("lb_nome", "Nome: *");
          setInnerHtml("lb_documento", "CPF: *");
        }
      }
    });
  });
}

function setRadio(value) {
  if (value == "PF") {
    setChecked("radio-pf", true);
  } else {
    setChecked("radio-pj", true);
  }
}

function getRadio() {
  if (getChecked("radio-pf") == true) {
    return "PF";
  } else {
    return "PJ";
  }
}

async function getDados() {
  const response = await fetch(`/getMeusDados`);

  const data = await response.json();
  setRadio(data[0].p_tipocliente);
  setText("txt_razaosocial", data[0].p_nomerazao);
  setText("txt_cnpj_cpf", data[0].p_cnpjcpf);
  setText("txt_cep", data[0].p_cep);
  setText("txt_endereco", data[0].p_endereco);
  setText("txt_bairro", data[0].p_bairro);
  setText("txt_cidade", data[0].p_cidade);
  setText("txt_estado", data[0].p_estado);
  setText("txt_numero", data[0].p_numero);
  setText("txt_lucro", data[0].p_lucro);
}

async function setMeusDados() {
  const nomerazao = getText("txt_razaosocial");
  const cpfcnpj = getText("txt_cnpj_cpf");
  const cep = getText("txt_cep");
  const endereco = getText("txt_endereco");
  const bairro = getText("txt_bairro");
  const cidade = getText("txt_cidade");
  const estado = getText("txt_estado");
  const numero = getText("txt_numero");
  const lucro = getText("txt_lucro");

  if (
    !nomerazao ||
    !cpfcnpj ||
    !cep ||
    !endereco ||
    !bairro ||
    !cidade ||
    !estado ||
    !numero ||
    !lucro
  ) {
    Swal.fire({
      icon: "warning",
      title: "ATENÇÃO",
      text: "Preencha os campos Obrigatórios",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    title: "Salvar",
    text: "Deseja salvar Alterações ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });

  if (result.isConfirmed)
    try {
      const data = {
        p_tipocliente: getRadio(),
        p_nomerazao: nomerazao,
        p_cnpjcpf: cpfcnpj,
        p_cep: cep,
        p_endereco: endereco,
        p_bairro: bairro,
        p_cidade: cidade,
        p_estado: estado,
        p_numero: numero,
        p_lucro: lucro,
      };

      const response = await fetch(`/setMeusDados`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      Swal.fire({
        icon: "success",
        title: "SUCESSO",
        text: "Alterações salvas com Sucesso !!!",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: `Ocorreu um erro ao processar requisição ${err}`,
      });
    }
}

async function fillBanks() {
  const response = await fetch(`/getBancos`);

  const data = await response.json();
  const tbody = document.getElementById("tbody-bank");
  clearTableBody("#tbody-bank");
  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.append(
      el("td", item.p_banco),
      el("td", item.p_agencia),
      el("td", item.p_numero),
      el("td", item.p_tipo_conta),
      el("td", item.p_pix)
    );
    const td = document.createElement("td");
    td.innerHTML = insertButtonCellTable("delBank");
    tr.append(td);
    td.style.textAlign = "center";
    tbody.appendChild(tr);
  });
}

async function setBanco() {
  const result = await Swal.fire({
    icon: "question",
    title: "Inserir",
    text: "Deseja salvar banco ?",
    showDenyButton: true,
    confirmButtonText: "Confirmar",
    denyButtonText: "Canncelar",
  });

  if (result.isConfirmed) {
    const data = {
      p_banco: getText("txt_banco"),
      p_tipo_conta: getText("txt_tipoconta"),
      p_numero: getText("txt_agencia"),
      p_agencia: getText("txt_numconta"),
      p_pix: getText("txt_pix"),
    };

    const response = await fetch(`/setBancos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Não foi possivel salvar banco",
      });
    }
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Banco inserido com sucesso !!!",
    });
    fillBanks();
  }
}

async function delBanco(button) {
  const bt = button.target.closest(".delBank");
  if (!bt) return;

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja excluir banco ?",
    confirmButtonText: "Sim",
    denyButtonText: "Não",
    showDenyButton: true,
  });
  if (result.isConfirmed) {
    try {
      const data = {
        p_banco: getValue(bt),
      };
      const response = await fetch(`/setDelBanco`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Banco removido com Sucesso !!!",
      });
      removeRow(button);
    } catch (erro) {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: `Não foi possivel salvar Alterações ${erro.message}`,
      });
    }
  }
}

function getValue(button) {
  const linha = button.closest("tr");
  const valor = linha.cells[0].innerHTML;
  return valor;
}

function removeRow(e) {
  const line = e.target.closest("tr");
  if (!line) return;
  line.remove();
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillStates();
  formatCEP("txt_cep");
  checkRadios();
  getDados();
  fillBanks();
  addEventToElement("#bt_update", "click", setMeusDados);
  addEventToElement("#bt_add_bank", "click", setBanco);
  addEventToElement("#tbody-bank", "click", delBanco);
});
