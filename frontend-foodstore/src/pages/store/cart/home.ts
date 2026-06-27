import { checkAuhtUser, logout } from "../../../utils/auth";
import { navigate } from "../../../utils/navigate";
import type { CartItem } from "../../../utils/renderElements";

const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
buttonLogout?.addEventListener("click", () => logout());

const cartItemsEl = document.getElementById("cart-items") as HTMLElement;
const cartTotalEl = document.getElementById("cart-total") as HTMLElement;
const cartSubtotalEl = document.getElementById("cart-subtotal") as HTMLElement;
const cartEmptyEl = document.getElementById("cart-empty") as HTMLElement;
const cartContentEl = document.getElementById("cart-content") as HTMLElement;
const orderSuccessEl = document.getElementById("order-success") as HTMLElement;
const btnClearCart = document.getElementById("btn-clear-cart") as HTMLButtonElement;
const btnConfirmOrder = document.getElementById("btn-confirm-order") as HTMLButtonElement;

let userEmail = "";
let cartKey = "";

function getCart(): CartItem[] {
  const raw = localStorage.getItem(cartKey);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function renderCart() {
  const cart = getCart();

  if (cart.length === 0) {
    cartEmptyEl.hidden = false;
    cartContentEl.hidden = true;
    return;
  }

  cartEmptyEl.hidden = true;
  cartContentEl.hidden = false;

  let total = 0;

  cartItemsEl.innerHTML = cart
    .map((item) => {
      const subtotal = item.product.precio * item.quantity;
      total += subtotal;
      return `
      <article class="cart-item" data-product-id="${item.product.id}">
        <img src="${item.product.imagen}" alt="${item.product.nombre}" />
        <div class="cart-item-info">
          <h3>${item.product.nombre}</h3>
          <p class="precio-unitario">$${item.product.precio.toFixed(2)} c/u</p>
          <div class="cart-qty-controls">
            <button type="button" class="btn-qty-decrease" data-id="${item.product.id}">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button type="button" class="btn-qty-increase" data-id="${item.product.id}" data-stock="${item.product.stock}">+</button>
          </div>
          <p class="subtotal">Subtotal: $${subtotal.toFixed(2)}</p>
        </div>
        <button type="button" class="btn-remove-item" data-id="${item.product.id}">Eliminar</button>
      </article>
    `;
    })
    .join("");

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  if (cartSubtotalEl) cartSubtotalEl.textContent = `$${total.toFixed(2)}`;
}

function handleCartEvents(e: Event) {
  const target = e.target as HTMLElement;
  const productId = parseInt(target.dataset["id"] ?? "0");
  if (!productId) return;

  let cart = getCart();
  const idx = cart.findIndex((i) => i.product.id === productId);
  if (idx < 0) return;

  if (target.classList.contains("btn-qty-increase")) {
    const maxStock = parseInt(target.dataset["stock"] ?? "0");
    if (cart[idx].quantity < maxStock) {
      cart[idx].quantity += 1;
    }
  } else if (target.classList.contains("btn-qty-decrease")) {
    if (cart[idx].quantity > 1) {
      cart[idx].quantity -= 1;
    }
  } else if (target.classList.contains("btn-remove-item")) {
    cart.splice(idx, 1);
    saveCart(cart);
    window.location.reload();
    return;
  }

  saveCart(cart);
  renderCart();
}

const initPage = () => {
  checkAuhtUser(
    "/src/pages/auth/login/login.html",
    "/src/pages/admin/home/home.html",
    ["client", "admin"],
  );

  const userData = localStorage.getItem("userData");
  if (!userData) {
    navigate("/src/pages/auth/login/login.html");
    return;
  }

  const user = JSON.parse(userData);
  userEmail = user.email;
  cartKey = `cart-${userEmail}`;

  renderCart();

  cartItemsEl.addEventListener("click", handleCartEvents);

  btnClearCart?.addEventListener("click", () => {
    saveCart([]);
    window.location.reload();
  });

  btnConfirmOrder?.addEventListener("click", () => {
    const cart = getCart();
    if (cart.length === 0) return;

    const total = cart.reduce(
      (acc, item) => acc + item.product.precio * item.quantity,
      0,
    );

    const order = {
      id: Date.now(),
      fecha: new Date().toISOString().split("T")[0],
      estado: "pending",
      total,
      formaPago: "EFECTIVO",
      detalles: cart.map((item) => ({
        cantidad: item.quantity,
        subtotal: item.product.precio * item.quantity,
        producto: item.product,
      })),
      usuarioDto: {
        mail: userEmail,
      },
    };

    const ordersKey = `orders-${userEmail}`;
    const existing = localStorage.getItem(ordersKey);
    const orders = existing ? JSON.parse(existing) : [];
    orders.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(orders));

    saveCart([]);
    window.location.reload();
  });
};

initPage();
