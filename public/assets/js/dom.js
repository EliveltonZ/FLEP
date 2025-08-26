export function createRow(cells) {
  const tr = document.createElement("tr");
  tr.innerHTML = cells;
  return tr;
}

export function clearTableBody(selector) {
  const tbody = document.querySelector(selector);
  if (tbody) tbody.innerHTML = "";
}