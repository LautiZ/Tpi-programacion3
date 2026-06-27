import { PRODUCTS } from "../../../data/data";
import { checkAuhtUser, logout } from "../../../utils/auth";
import { addCart } from "../../../utils/addCart";

const container = document.getElementById(
  "product-detail-container",
) as HTMLElement | null;

const logoutButton = document.getElementById(
  "logoutButton",
) as HTMLButtonElement | null;

logoutButton?.addEventListener("click", () => {
  logout();
});

const initPage = () => {
  checkAuhtUser(
    "/src/pages/auth/login/login.html",
    "/src/pages/admin/home/home.html",
    ["client", "admin"],
  );

  const userData = localStorage.getItem("userData");
  if (!userData) return;

  const user = JSON.parse(userData);
  const userEmail: string = user.email;

  const linkCart = document.getElementById(
    "linkCart",
  ) as HTMLAnchorElement | null;
  const cartKey = `cart-${userEmail}`;
  const existingCart = localStorage.getItem(cartKey);
  const cart = existingCart ? JSON.parse(existingCart) : [];
  if (linkCart) {
    linkCart.innerHTML = `Carrito <span class="cart-count">${cart.length}</span>`;
  }

  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");

  if (!container) return;

  if (!idParam) {
    container.innerHTML = "<p class='no-results'>Producto no encontrado.</p>";
    return;
  }

  const productId = parseInt(idParam, 10);
  const product = PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    container.innerHTML = "<p class='no-results'>Producto no encontrado.</p>";
    return;
  }

  const isAvailable = product.disponible && product.stock > 0;
  const addDisabled = isAvailable ? "" : "disabled";

  const availabilityBadge = isAvailable
    ? `<span class="badge-disponible">Disponible (Stock: ${product.stock})</span>`
    : `<span class="badge-agotado">Sin stock</span>`;

  container.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-content">
        <img
          src="${product.imagen}"
          alt="${product.nombre}"
          class="product-detail-img"
        />

        <div class="product-detail-info">
          <span class="product-category-badge">${product.categoria.nombre}</span>

          <h1 class="product-detail-name">${product.nombre}</h1>

          <p class="product-detail-price">$${product.precio.toFixed(2)}</p>

          ${availabilityBadge}

          <p class="product-detail-description">${product.descripcion}</p>

          <form class="add-to-cart-form" action="">
            <input type="hidden" name="product_id" value="${product.id}" />
            <input type="hidden" id="quantity" name="quantity" value="1" />

            <div class="detail-qty-controls">
              <button type="button" id="btn-qty-decrease" class="btn-qty-step" ${addDisabled}>-</button>
              <span id="qty-display" class="qty-display">1</span>
              <button type="button" id="btn-qty-increase" class="btn-qty-step" ${addDisabled}>+</button>
            </div>

            <div class="detail-action-buttons">
              <button type="submit" class="btn-add-to-cart" ${addDisabled}>Agregar al Carrito</button>
              <a href="../home/home.html" class="btn-back">&larr; Volver</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const qtyInput = container.querySelector("#quantity") as HTMLInputElement;
  const qtyDisplay = container.querySelector("#qty-display") as HTMLElement;
  const btnDecrease = container.querySelector("#btn-qty-decrease") as HTMLButtonElement;
  const btnIncrease = container.querySelector("#btn-qty-increase") as HTMLButtonElement;

  btnDecrease?.addEventListener("click", () => {
    const current = parseInt(qtyInput.value, 10);
    if (current > 1) {
      qtyInput.value = String(current - 1);
      qtyDisplay.textContent = qtyInput.value;
    }
  });

  btnIncrease?.addEventListener("click", () => {
    const current = parseInt(qtyInput.value, 10);
    if (current < product.stock) {
      qtyInput.value = String(current + 1);
      qtyDisplay.textContent = qtyInput.value;
    }
  });

  container.addEventListener("submit", (e: Event) => {
    const freshUserData = localStorage.getItem("userData");
    if (!freshUserData) return;
    const freshUser = JSON.parse(freshUserData);
    addCart(e, freshUser.email);
  });
};

initPage();
