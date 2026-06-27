import { checkAuhtUser, logout } from "../../../utils/auth";
import { navigate } from "../../../utils/navigate";
import { syncMarkedCategory } from "../../../utils/markedCategory";
import {
  renderCategories,
  renderProducts,
} from "../../../utils/renderElements";

const productsContainer = document.getElementById("contenedor-productos") as HTMLElement | null;
const categoriesContainer = document.getElementById("lista-categorias") as HTMLElement | null;
const adminBtn = document.getElementById("adminButton") as HTMLAnchorElement | null;
const ordersBtn = document.getElementById("ordersButton") as HTMLAnchorElement | null;
const searchForm = document.getElementById("searchForm") as HTMLFormElement | null;
const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
const sortSelect = document.getElementById("sort-select") as HTMLSelectElement | null;
const disponibilidadSelect = document.getElementById("disponibilidad-select") as HTMLSelectElement | null;
const productCountEl = document.getElementById("product-count") as HTMLElement | null;

document.getElementById("logoutButton")?.addEventListener("click", () => logout());

if (!searchForm || !searchInput) {
  throw new Error("Search form elements were not found in the DOM.");
}

function currentCategoryQuery(): string {
  return (new URLSearchParams(window.location.search).get("categoria") || "").toLowerCase();
}

function reRender(): void {
  const searchTerm = searchInput!.value.toLowerCase();
  const sort = sortSelect?.value ?? "";
  const disponibilidad = disponibilidadSelect?.value ?? "";
  const count = renderProducts(searchTerm, currentCategoryQuery(), productsContainer, null, sort, disponibilidad);
  if (productCountEl) productCountEl.textContent = `${count} productos`;
}

searchForm.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();
  reRender();
});

sortSelect?.addEventListener("change", reRender);
disponibilidadSelect?.addEventListener("change", reRender);

const initPage = () => {
  checkAuhtUser(
    "/src/pages/auth/login/login.html",
    "/src/pages/admin/home/home.html",
    ["client", "admin"],
  );

  const userData = localStorage.getItem("userData");
  let userEmail = "";

  if (!userData) {
    navigate("/src/pages/auth/login/login.html");
    return;
  } else {
    const user = JSON.parse(userData);
    userEmail = user.email;

    const navUserName = document.getElementById("nav-user-name");
    if (navUserName) navUserName.textContent = userEmail;

    if (user.role === "admin") {
      adminBtn?.removeAttribute("hidden");
    } else {
      ordersBtn?.removeAttribute("hidden");
    }
  }

  const queryParams = new URLSearchParams(window.location.search);
  const searchQuery = (queryParams.get("q") || "").toLowerCase();
  const categoryQuery = (queryParams.get("categoria") || "").toLowerCase();

  searchInput.value = searchQuery;

  renderCategories(categoriesContainer);
  const count = renderProducts(searchQuery, categoryQuery, productsContainer, null);
  if (productCountEl) productCountEl.textContent = `${count} productos`;
  syncMarkedCategory(categoryQuery, categoriesContainer);

  const linkCart = document.getElementById("linkCart") as HTMLAnchorElement | null;
  const cartKey = `cart-${userEmail}`;
  const existingCart = localStorage.getItem(cartKey) ?? null;
  const cart = existingCart ? JSON.parse(existingCart) : [];
  if (linkCart) {
    linkCart.innerHTML = `Carrito <span class="cart-count">${cart.length}</span>`;
  }
};

initPage();
