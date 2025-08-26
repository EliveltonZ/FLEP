import { formatCurrency, onmouseover, getText, getCookie } from "./utils.js";
import { enableTableFilterSort } from "./filtertable.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function fillTableMateriais() {
  const response = await fetch(
    `/fillTableMateriais?p_marcenaria=${await getCookie("id")}`
  );

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
      <td style="text-align: center">${formatCurrency(item.p_preco)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function fillTableCategorias() {
  const response = await fetch(
    `/fillTableCategorias?p_marcenaria=${await getCookie("id")}`
  );
  if (!response.ok) {
    Swal.fire({
      icon: "error",
      message: "nao foi possivel carregar dados",
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

window.setCategoria = async function () {
  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir nova Categoria ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });

  if (result.isConfirmed) {
    const idCategoria = getText("cod_categoria");
    const categoria = getText("desc_categoria");
    const data = {
      p_id_marcenaria: await getCookie("id"),
      p_id_categoria: idCategoria,
      p_categoria: categoria,
    };

    const response = await fetch("/setCategoria", {
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
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Categoria inserida com Sucesso !!!",
      });
    }
  }
};

window.setMaterais = async function () {
  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir o novo material ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });

  if (result.isConfirmed) {
    const data = {
      p_id_marcenaria: await getCookie("id"),
      p_descricao: getText("desc_material"),
      p_unidade: getText("unid_material"),
      p_preco: getText("preco_material"),
      p_id_categoria: getText("cat_material"),
      p_id_material: getText("cod_material"),
    };
    // console.log(data);
    const response = await fetch("/setMateriais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errText = response.text();
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Não foi possivel inserir Material" + errText,
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Material inserido com sucesso !!!",
      });
    }
  }
};

async function optionCategorias() {
  const response = await fetch(
    `/fillTableCategorias?p_marcenaria=${await getCookie("id")}`
  );

  const data = await response.json();
  const select = document.getElementById("cat_material");

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
  onmouseover("ctable");
  onmouseover("mtable");
  enableTableFilterSort("ctable");
  enableTableFilterSort("mtable");
  optionCategorias();
});
