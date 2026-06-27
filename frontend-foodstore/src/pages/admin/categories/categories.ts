import type { ICategory } from "../../../types/ICategory";
import type { Product } from "../../../types/Product";
import categoriasJson from "../../../data/categorias.json";
import productosJson from "../../../data/productos.json";
import { checkAuhtUser, logout } from "../../../utils/auth";

checkAuhtUser(
  "/src/pages/auth/login/login.html",
  "/src/pages/store/home/home.html",
  ["admin"],
);

const STORAGE_KEY = "admin-categories";
const products: Product[] = productosJson as unknown as Product[];

let editingId: number | null = null;

// --- Persistence ---

function loadCategories(): ICategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ICategory[];
  } catch { /* ignore */ }
  return categoriasJson.map((c) => ({ ...c }));
}

function saveCategories(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

let categories: ICategory[] = loadCategories();

// --- Helpers ---

function countProducts(categoryId: number): number {
  return products.filter((p) => p.categoria.id === categoryId).length;
}

function nextId(): number {
  return categories.length ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
}

// --- Rendering ---

function buildViewRow(category: ICategory): string {
  const productCount = countProducts(category.id);
  return `
    <tr data-id="${category.id}">
      <td>${category.id}</td>
      <td>${category.nombre}</td>
      <td>${category.descripcion}</td>
      <td>${productCount}</td>
      <td class="row-actions">
        <button class="btn-edit" data-action="edit" data-id="${category.id}">Editar</button>
        <button class="btn-delete" data-action="delete" data-id="${category.id}">Eliminar</button>
      </td>
    </tr>
  `;
}

function buildEditRow(category: ICategory): string {
  const productCount = countProducts(category.id);
  return `
    <tr data-id="${category.id}" class="editing-row">
      <td>${category.id}</td>
      <td><input type="text" class="edit-nombre" value="${category.nombre}" required /></td>
      <td><input type="text" class="edit-descripcion" value="${category.descripcion}" required /></td>
      <td>${productCount}</td>
      <td class="row-actions">
        <button class="btn-save" data-action="save" data-id="${category.id}">Guardar</button>
        <button class="btn-cancel" data-action="cancel" data-id="${category.id}">Cancelar</button>
      </td>
    </tr>
  `;
}

function render(): void {
  const tbody = document.getElementById("categories-tbody");
  if (!tbody) return;

  tbody.innerHTML = categories
    .map((c) => (c.id === editingId ? buildEditRow(c) : buildViewRow(c)))
    .join("");
}

// --- Event delegation on tbody ---

function attachTbodyListeners(): void {
  const tbody = document.getElementById("categories-tbody");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("button[data-action]") as HTMLButtonElement | null;
    if (!btn) return;

    const id = Number(btn.dataset["id"]);
    const action = btn.dataset["action"];

    switch (action) {
      case "edit": {
        editingId = id;
        render();
        break;
      }
      case "delete": {
        categories = categories.filter((c) => c.id !== id);
        if (editingId === id) editingId = null;
        saveCategories();
        render();
        break;
      }
      case "save": {
        const row = btn.closest("tr");
        if (!row) break;

        const nombreInput = row.querySelector<HTMLInputElement>(".edit-nombre");
        const descripcionInput = row.querySelector<HTMLInputElement>(".edit-descripcion");

        if (!nombreInput || !descripcionInput) break;

        const nombre = nombreInput.value.trim();
        const descripcion = descripcionInput.value.trim();

        if (!nombre || !descripcion) {
          alert("Nombre y descripción son obligatorios.");
          break;
        }

        categories = categories.map((c) =>
          c.id === id ? { ...c, nombre, descripcion } : c,
        );
        editingId = null;
        saveCategories();
        render();
        break;
      }
      case "cancel": {
        editingId = null;
        render();
        break;
      }
    }
  });
}

// --- Add category form ---

function setupAddForm(): void {
  const toggleBtn = document.getElementById("toggleAddForm");
  const formSection = document.getElementById("add-form-section");
  const form = document.getElementById("add-category-form") as HTMLFormElement | null;
  const cancelBtn = document.getElementById("cancelAdd");

  toggleBtn?.addEventListener("click", () => {
    if (formSection) {
      formSection.style.display =
        formSection.style.display === "none" ? "block" : "none";
    }
  });

  cancelBtn?.addEventListener("click", () => {
    if (formSection) formSection.style.display = "none";
    form?.reset();
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombreInput = form.elements.namedItem("nombre") as HTMLInputElement;
    const descripcionInput = form.elements.namedItem("descripcion") as HTMLInputElement;

    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput.value.trim();

    if (!nombre || !descripcion) {
      alert("Nombre y descripción son obligatorios.");
      return;
    }

    const newCategory: ICategory = {
      id: nextId(),
      nombre,
      descripcion,
    };

    categories.push(newCategory);
    saveCategories();
    render();
    form.reset();

    if (formSection) formSection.style.display = "none";
  });
}

// --- Logout ---

function setupLogout(): void {
  const logoutBtn = document.getElementById("logoutButton");
  logoutBtn?.addEventListener("click", () => {
    logout();
  });
}

// --- Init ---

function init(): void {
  render();
  attachTbodyListeners();
  setupAddForm();
  setupLogout();
}

init();
