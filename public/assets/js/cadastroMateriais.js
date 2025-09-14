import { FormatUtils, EventUtils, DomUtils, API } from "./utils.js";
import { enableTableFilterSort } from "./filtertable.js";
import Swal from "./sweetalert2.esm.all.min.js";

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
async function fillTableMateriais() {
  const response = await API.apiFetch(`/fillTableMateriais`);

  if (!response.ok) {
    Swal.fire({
      icon: "error",
      message: "nao foi possivel carregar dados",
    });
  } else {
    const data = await response.json();
    const tbody = document.querySelectorAll("table tbody")[1];
    tbody.innerHTML = "";
    data.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td style="text-align: center" >${item.p_id_material}</td>
      <td >${item.p_descricao}</td>
      <td style="text-align: center">${item.p_unidade}</td>
      <td style="text-align: center">${FormatUtils.formatCurrencyBR(
        item.p_preco
      )}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function fillTableCategorias() {
  const response = await API.apiFetch(`/fillTableCategorias`);
  if (!response.ok) {
    Swal.fire({
      icon: "error",
      text: "nao foi possivel carregar dados",
    });
  } else {
    const data = await response.json();
    const tbody = document.querySelectorAll("table tbody")[0];
    tbody.innerHTML = "";
    data.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td style="text-align: center" >${item.p_cod_categoria}</td>
      <td >${item.p_descricao}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function setCategoria() {
  const idCategoria = DomUtils.getText("cod_categoria");
  const categoria = DomUtils.getText("desc_categoria");

  if (!idCategoria || !categoria) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Preencha os campos em branco",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir nova Categoria ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });

  if (result.isConfirmed) {
    const data = {
      p_id_categoria: idCategoria,
      p_categoria: categoria.toUpperCase(),
    };

    const response = await API.apiFetch("/setCategoria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Houve um problema ao salvar os dados",
      });
      return;
    } else {
      fillTableCategorias();
      optionCategorias();
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Categoria inserida com Sucesso !!!",
      });
    }
  }
}

async function setMaterais() {
  const descricao = DomUtils.getText("desc_material");
  const unidade = DomUtils.getText("unid_material");
  const preco = DomUtils.getText("preco_material");
  const categoria = DomUtils.getText("cat_material");
  const codigo = DomUtils.getText("cod_material");

  if (!descricao || !unidade || !preco || !categoria || !codigo) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Todos os campos devem ser preenchidos antes de inserir!",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir o novo material ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });

  if (result.isConfirmed) {
    const data = {
      p_descricao: descricao,
      p_unidade: unidade,
      p_preco: preco,
      p_id_categoria: categoria,
      p_id_material: codigo,
    };

    const response = await API.apiFetch("/setMateriais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errText = await response.text();
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Não foi possível inserir Material: " + errText,
      });
    } else {
      fillTableMateriais();
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Material inserido com sucesso !!!",
      });
    }
  }
}

async function optionCategorias() {
  const response = await API.apiFetch(`/fillTableCategorias`);

  const data = await response.json();
  const select = document.getElementById("cat_material");
  select.innerHTML = `<option value="">Selecione a categoria</option>`;

  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.p_cod_categoria;
    option.textContent = item.p_descricao;
    select.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillTableMateriais();
  fillTableCategorias();
  EventUtils.tableHover("ctable");
  EventUtils.tableHover("mtable");
  enableTableFilterSort("ctable");
  enableTableFilterSort("mtable");
  optionCategorias();
});

EventUtils.addEventToElement("#bt_new_material", "click", setMaterais);
EventUtils.addEventToElement("#bt_new_category", "click", setCategoria);
