import pedidosJson from "../../../data/pedidos.json";
import { checkAuhtUser, logout } from "../../../utils/auth";
import { navigate } from "../../../utils/navigate";

interface OrderProduct {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
}

interface OrderDetail {
  cantidad: number;
  subtotal: number;
  producto: OrderProduct;
}

interface Order {
  id: number;
  fecha: string;
  estado: string;
  total: number;
  formaPago: string;
  detalles: OrderDetail[];
  usuarioDto: { mail: string; celular?: string };
}

function formatDate(fecha: string): string {
  const parts = fecha.split("-");
  if (parts.length !== 3) return fecha;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function formatDateLong(fecha: string): string {
  const parts = fecha.split("-");
  if (parts.length !== 3) return fecha;
  const [y, m, d] = parts;
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const monthName = months[parseInt(m, 10) - 1] ?? m;
  return `${parseInt(d, 10)} de ${monthName} de ${y}`;
}

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  processing: "En preparación",
  completed: "Entregado",
  cancelled: "Cancelado",
};

const formaPagoLabel: Record<string, string> = {
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
};

const statusMessages: Record<string, { title: string; sub: string }> = {
  pending: {
    title: "Tu pedido está siendo procesado",
    sub: "Te notificaremos cuando sea confirmado.",
  },
  processing: {
    title: "Tu pedido está en preparación",
    sub: "Pronto estará listo.",
  },
  completed: {
    title: "Tu pedido fue entregado",
    sub: "¡Esperamos que hayas disfrutado tu compra!",
  },
  cancelled: {
    title: "Tu pedido fue cancelado",
    sub: "Contactate con nosotros si tenés alguna consulta.",
  },
};

function buildOrderCard(order: Order): string {
  const badgeClass = `badge badge-${order.estado.toLowerCase()}`;
  const label = statusLabel[order.estado] ?? order.estado;
  const totalItems = order.detalles.reduce((acc, d) => acc + d.cantidad, 0);

  const previewItems = order.detalles
    .map(
      (d) =>
        `<li class="order-preview-item">• ${d.producto.nombre} (x${d.cantidad})</li>`,
    )
    .join("");

  return `
    <article class="order-card" data-order-id="${order.id}">
      <div class="order-card-header">
        <div class="order-meta">
          <span class="order-id">Pedido #${order.id}</span>
          <span>${formatDate(order.fecha)}</span>
        </div>
        <div class="order-actions">
          <span class="${badgeClass}">${label}</span>
          <span class="order-total">$${order.total.toFixed(2)}</span>
          <button type="button" class="btn-toggle-detail" data-order-id="${order.id}">
            Ver detalle
          </button>
        </div>
      </div>
      <ul class="order-preview-list">${previewItems}</ul>
      <p class="order-items-count">${totalItems} producto${totalItems === 1 ? "" : "s"}</p>
    </article>`;
}

function buildModalContent(order: Order, userPhone: string): string {
  const badgeClass = `badge badge-${order.estado.toLowerCase()}`;
  const label = statusLabel[order.estado] ?? order.estado;
  const pagoLabel = formaPagoLabel[order.formaPago] ?? order.formaPago;
  const msg = statusMessages[order.estado] ?? { title: order.estado, sub: "" };

  const productRows = order.detalles
    .map(
      (d) => `
      <div class="modal-product-row">
        <div class="modal-product-info">
          <strong>${d.producto.nombre}</strong>
          <span>Cantidad: ${d.cantidad} × $${d.producto.precio.toFixed(2)}</span>
        </div>
        <span class="modal-product-price">$${d.subtotal.toFixed(2)}</span>
      </div>`,
    )
    .join("");

  return `
    <div class="modal-badge-row">
      <span class="${badgeClass}">${label}</span>
    </div>
    <p class="modal-date">📅 ${formatDateLong(order.fecha)}</p>

    <div class="modal-section">
      <h3 class="modal-section-title">📍 Información de Entrega</h3>
      <p class="modal-section-field"><span>Teléfono:</span> ${userPhone || "—"}</p>
      <p class="modal-section-field"><span>Método de pago:</span> 💳 ${pagoLabel}</p>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">🛒 Productos</h3>
      ${productRows}
    </div>

    <hr class="modal-divider" />
    <div class="modal-total-row">
      <strong>Total:</strong>
      <span class="modal-total-amount">$${order.total.toFixed(2)}</span>
    </div>

    <div class="modal-status-box">
      <p class="modal-status-title">🔄 ${msg.title}</p>
      <p class="modal-status-sub">${msg.sub}</p>
    </div>`;
}

// Modal logic
const modalOverlay = document.getElementById(
  "order-modal",
) as HTMLElement | null;
const modalBody = document.getElementById(
  "order-modal-body",
) as HTMLElement | null;
const modalClose = document.getElementById(
  "order-modal-close",
) as HTMLButtonElement | null;

function openModal(order: Order, userPhone: string): void {
  if (!modalOverlay || !modalBody) return;
  modalBody.innerHTML = buildModalContent(order, userPhone);
  modalOverlay.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(): void {
  if (!modalOverlay) return;
  modalOverlay.setAttribute("hidden", "");
  document.body.style.overflow = "";
}

modalClose?.addEventListener("click", closeModal);

modalOverlay?.addEventListener("click", (e: Event) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape") closeModal();
});

// Logout
const buttonLogout = document.getElementById(
  "logoutButton",
) as HTMLButtonElement | null;
buttonLogout?.addEventListener("click", () => {
  logout();
});

const ordersContainer = document.getElementById(
  "orders-container",
) as HTMLElement | null;
const ordersEmpty = document.getElementById(
  "orders-empty",
) as HTMLElement | null;
const linkCart = document.getElementById(
  "linkCart",
) as HTMLAnchorElement | null;

const initPage = () => {
  checkAuhtUser(
    "/src/pages/auth/login/login.html",
    "/src/pages/admin/home/home.html",
    ["client"],
  );

  const userData = localStorage.getItem("userData");
  if (!userData) {
    navigate("/src/pages/auth/login/login.html");
    return;
  }

  const user = JSON.parse(userData) as { email: string; celular?: string };
  const userEmail = user.email;
  const userPhone = user.celular ?? "";

  // Update cart badge
  const cartKey = `cart-${userEmail}`;
  const existingCart = localStorage.getItem(cartKey);
  const cart: unknown[] = existingCart
    ? (JSON.parse(existingCart) as unknown[])
    : [];
  if (linkCart) {
    linkCart.innerHTML = `Carrito <span class="cart-count">${cart.length}</span>`;
  }

  // Load orders from localStorage
  const ordersKey = `orders-${userEmail}`;
  const rawLocalOrders = localStorage.getItem(ordersKey);
  const localOrders: Order[] = rawLocalOrders
    ? (JSON.parse(rawLocalOrders) as Order[])
    : [];

  // Load orders from JSON filtered by email
  const jsonOrders = (pedidosJson as unknown as Order[]).filter(
    (o) => o.usuarioDto.mail === userEmail,
  );

  const localIds = new Set(localOrders.map((o) => o.id));
  const allOrders: Order[] = [
    ...localOrders,
    ...jsonOrders.filter((o) => !localIds.has(o.id)),
  ];

  allOrders.sort((a, b) => {
    if (a.fecha < b.fecha) return 1;
    if (a.fecha > b.fecha) return -1;
    return 0;
  });

  if (allOrders.length === 0) {
    if (ordersEmpty) ordersEmpty.removeAttribute("hidden");
    return;
  }

  if (ordersContainer) {
    ordersContainer.innerHTML = allOrders.map(buildOrderCard).join("");
  }

  // Delegate click for "Ver detalle" → open modal
  ordersContainer?.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("btn-toggle-detail")) return;

    const orderId = target.dataset["orderId"];
    if (!orderId) return;

    const order = allOrders.find((o) => String(o.id) === orderId);
    if (!order) return;

    // Phone from order data if available, otherwise fall back to logged-in user's phone
    const phone = order.usuarioDto.celular ?? userPhone;
    openModal(order, phone);
  });
};

initPage();
