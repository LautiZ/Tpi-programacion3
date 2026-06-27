import pedidosJson from "../../../data/pedidos.json";
import { checkAuhtUser, logout } from "../../../utils/auth";

checkAuhtUser(
  "/src/pages/auth/login/login.html",
  "/src/pages/store/home/home.html",
  ["admin"],
);

interface OrderDetalle {
  cantidad: number;
  subtotal: number;
  producto: { id: number; nombre: string; precio: number; imagen: string };
}

interface Order {
  id: number;
  fecha: string;
  estado: string;
  total: number;
  formaPago: string;
  detalles: OrderDetalle[];
  usuarioDto: { mail: string; nombre?: string; apellido?: string };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En preparación",
  completed: "Entregado",
  cancelled: "Cancelado",
};

function readUserOrders(email: string): Order[] {
  try {
    const raw = localStorage.getItem(`orders-${email}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

function writeUserOrders(email: string, orders: Order[]): void {
  localStorage.setItem(`orders-${email}`, JSON.stringify(orders));
}

// Ensure every JSON order exists in the client's localStorage so status
// changes always edit in place and never create duplicate records.
function syncJsonOrdersToLocalStorage(): void {
  const byEmail: Record<string, Order[]> = {};
  (pedidosJson as unknown as Order[]).forEach((o) => {
    const email = o.usuarioDto.mail;
    if (!byEmail[email]) byEmail[email] = [];
    byEmail[email].push(o);
  });

  Object.entries(byEmail).forEach(([email, jsonOrders]) => {
    const existing = readUserOrders(email);
    const existingIds = new Set(existing.map((o) => o.id));
    const missing = jsonOrders.filter((o) => !existingIds.has(o.id));
    if (missing.length > 0) {
      writeUserOrders(email, [...existing, ...missing]);
    }
  });
}

function updateOrderStatus(order: Order, newEstado: string): void {
  const email = order.usuarioDto.mail;
  const userOrders = readUserOrders(email);
  const idx = userOrders.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    userOrders[idx].estado = newEstado;
    writeUserOrders(email, userOrders);
  }
}

syncJsonOrdersToLocalStorage();

const orders: Order[] = Object.keys(localStorage)
  .filter((key) => key.startsWith("orders-"))
  .flatMap((key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(parsed) ? (parsed as Order[]) : [];
    } catch {
      return [];
    }
  })
  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

const ordersContainer = document.getElementById("orders-container") as HTMLElement;
const statusFilter = document.getElementById("status-filter") as HTMLSelectElement;
const ordersEmpty = document.getElementById("orders-empty") as HTMLElement;

function formatDate(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function clientLabel(o: Order): string {
  return o.usuarioDto.nombre
    ? `${o.usuarioDto.nombre} ${o.usuarioDto.apellido ?? ""}`.trim()
    : o.usuarioDto.mail;
}

function renderOrders(filter: string): void {
  const filtered = filter ? orders.filter((o) => o.estado === filter) : orders;

  if (filtered.length === 0) {
    ordersContainer.innerHTML = "";
    ordersEmpty.hidden = false;
    return;
  }

  ordersEmpty.hidden = true;

  ordersContainer.innerHTML = filtered
    .map(
      (o) => `
    <div class="order-admin-card">
      <div class="order-admin-card-header">
        <div class="order-admin-card-info">
          <span class="order-admin-id">Pedido #${o.id}</span>
          <span class="order-admin-client">${clientLabel(o)}</span>
          <span class="order-admin-date">${formatDate(o.fecha)}</span>
        </div>
        <span class="badge badge-${o.estado.toLowerCase()}">${STATUS_LABELS[o.estado] ?? o.estado}</span>
      </div>
      <div class="order-admin-card-body">
        <span>${o.detalles.length} producto${o.detalles.length !== 1 ? "s" : ""}</span>
        <span>Pago: ${o.formaPago}</span>
        <span class="order-admin-total">Total: $${o.total.toFixed(2)}</span>
      </div>
      <div class="order-admin-card-actions">
        <button class="btn-change-status btn-secondary" data-id="${o.id}" data-current="${o.estado}">
          Cambiar estado
        </button>
      </div>
    </div>
  `,
    )
    .join("");
}

const STATUS_CYCLE: Record<string, string> = {
  pending: "processing",
  processing: "completed",
  completed: "cancelled",
  cancelled: "pending",
};

ordersContainer.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest(".btn-change-status") as HTMLButtonElement | null;
  if (!btn) return;

  const id = parseInt(btn.dataset["id"] ?? "0");
  const current = btn.dataset["current"] ?? "";
  const order = orders.find((o) => o.id === id);
  if (!order) return;

  order.estado = STATUS_CYCLE[current] ?? "pending";
  updateOrderStatus(order, order.estado);
  renderOrders(statusFilter.value);
});

statusFilter.addEventListener("change", () => renderOrders(statusFilter.value));

document.getElementById("logoutButton")?.addEventListener("click", () => logout());

renderOrders("");
