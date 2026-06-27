import productosJson from "../../../data/productos.json";
import categoriasJson from "../../../data/categorias.json";
import { checkAuhtUser, logout } from "../../../utils/auth";
import type { Product } from "../../../types/Product";
import type { ICategory } from "../../../types/ICategory";

checkAuhtUser(
  "/src/pages/auth/login/login.html",
  "/src/pages/store/home/home.html",
  ["admin"],
);

const PRODUCTS_KEY = "admin-products";
const CATEGORIES_KEY = "admin-categories";

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch { /* ignore */ }
  return (productosJson as unknown as Product[]).map((p) => ({ ...p }));
}

function saveProducts(): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function loadCategories(): ICategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) return JSON.parse(raw) as ICategory[];
  } catch { /* ignore */ }
  return categoriasJson as unknown as ICategory[];
}

let products: Product[] = loadProducts();
const categories: ICategory[] = loadCategories();

let editingId: number | null = null;

function nextId(): number {
  return products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
}

function renderTable(): void {
  const tbody = document.getElementById("products-tbody");
  if (!tbody) return;

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr data-id="${p.id}">
      <td>${p.id}</td>
      <td><img src="${p.imagen}" alt="${p.nombre}" width="60" style="object-fit:cover;border-radius:4px;" /></td>
      <td>${p.nombre}</td>
      <td>${p.categoria.nombre}</td>
      <td>$${p.precio.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td><span class="${p.disponible ? "badge-active" : "badge-inactive"}">${p.disponible ? "Activo" : "Inactivo"}</span></td>
      <td class="row-actions">
        <button class="btn-edit" data-action="edit" data-id="${p.id}">Editar</button>
        <button class="btn-delete" data-action="delete" data-id="${p.id}">Eliminar</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function populateCategorySelect(): void {
  const select = document.getElementById("prod-categoria") as HTMLSelectElement | null;
  if (!select) return;
  select.innerHTML = categories
    .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
    .join("");
}

function showForm(product?: Product): void {
  const section = document.getElementById("product-form-section") as HTMLElement;
  const titleEl = document.getElementById("form-title") as HTMLElement;
  const editIdInput = document.getElementById("edit-product-id") as HTMLInputElement;
  const nombreInput = document.getElementById("prod-nombre") as HTMLInputElement;
  const precioInput = document.getElementById("prod-precio") as HTMLInputElement;
  const descInput = document.getElementById("prod-descripcion") as HTMLInputElement;
  const stockInput = document.getElementById("prod-stock") as HTMLInputElement;
  const imagenInput = document.getElementById("prod-imagen") as HTMLInputElement;
  const catSelect = document.getElementById("prod-categoria") as HTMLSelectElement;
  const disponibleInput = document.getElementById("prod-disponible") as HTMLInputElement;

  if (product) {
    titleEl.textContent = "Editar producto";
    editIdInput.value = String(product.id);
    nombreInput.value = product.nombre;
    precioInput.value = String(product.precio);
    descInput.value = product.descripcion;
    stockInput.value = String(product.stock);
    imagenInput.value = product.imagen;
    catSelect.value = String(product.categoria.id);
    disponibleInput.checked = product.disponible;
    editingId = product.id;
  } else {
    titleEl.textContent = "Agregar producto";
    editIdInput.value = "";
    (document.getElementById("product-form") as HTMLFormElement)?.reset();
    editingId = null;
  }

  section.hidden = false;
}

function hideForm(): void {
  const section = document.getElementById("product-form-section") as HTMLElement;
  section.hidden = true;
  editingId = null;
}

function setupTableEvents(): void {
  const tbody = document.getElementById("products-tbody");
  tbody?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("button[data-action]") as HTMLButtonElement | null;
    if (!btn) return;

    const id = Number(btn.dataset["id"]);
    const action = btn.dataset["action"];

    if (action === "edit") {
      const product = products.find((p) => p.id === id);
      if (product) showForm(product);
    } else if (action === "delete") {
      products = products.filter((p) => p.id !== id);
      if (editingId === id) hideForm();
      saveProducts();
      renderTable();
    }
  });
}

function setupForm(): void {
  const form = document.getElementById("product-form") as HTMLFormElement | null;
  const btnAdd = document.getElementById("btn-add-product");
  const btnCancel = document.getElementById("btn-cancel-product");

  btnAdd?.addEventListener("click", () => showForm());
  btnCancel?.addEventListener("click", () => hideForm());

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const editIdInput = document.getElementById("edit-product-id") as HTMLInputElement;
    const nombre = (document.getElementById("prod-nombre") as HTMLInputElement).value.trim();
    const precio = parseFloat((document.getElementById("prod-precio") as HTMLInputElement).value);
    const descripcion = (document.getElementById("prod-descripcion") as HTMLInputElement).value.trim();
    const stock = parseInt((document.getElementById("prod-stock") as HTMLInputElement).value);
    const imagen = (document.getElementById("prod-imagen") as HTMLInputElement).value.trim();
    const catId = parseInt((document.getElementById("prod-categoria") as HTMLSelectElement).value);
    const disponible = (document.getElementById("prod-disponible") as HTMLInputElement).checked;

    const categoria = categories.find((c) => c.id === catId) ?? categories[0];

    const existingId = parseInt(editIdInput.value);

    if (existingId) {
      products = products.map((p) =>
        p.id === existingId
          ? { ...p, nombre, precio, descripcion, stock, imagen, disponible, categoria }
          : p,
      );
    } else {
      products.push({ id: nextId(), nombre, precio, descripcion, stock, imagen, disponible, categoria });
    }

    saveProducts();
    hideForm();
    renderTable();
  });
}

function init(): void {
  populateCategorySelect();
  renderTable();
  setupTableEvents();
  setupForm();

  document.getElementById("logoutButton")?.addEventListener("click", () => logout());
}

init();
