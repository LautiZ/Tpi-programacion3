import { checkAuhtUser, logout } from "../../../utils/auth";
import { PRODUCTS, getCategories } from "../../../data/data";
import pedidosJson from "../../../data/pedidos.json";

const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
buttonLogout?.addEventListener("click", () => {
  logout();
});

const initPage = () => {
  checkAuhtUser(
    "/src/pages/auth/login/login.html",
    "/src/pages/store/home/home.html",
    ["admin"],
  );

  const categories = getCategories();
  const products = PRODUCTS;

  // Sync JSON orders into each client's localStorage key (idempotent — only adds missing ones)
  interface SyncOrder { id: number; estado: string; usuarioDto: { mail: string } }
  const byEmail: Record<string, SyncOrder[]> = {};
  (pedidosJson as unknown as SyncOrder[]).forEach((o) => {
    if (!byEmail[o.usuarioDto.mail]) byEmail[o.usuarioDto.mail] = [];
    byEmail[o.usuarioDto.mail].push(o);
  });
  Object.entries(byEmail).forEach(([email, jsonOrders]) => {
    const key = `orders-${email}`;
    try {
      const raw = localStorage.getItem(key);
      const existing: SyncOrder[] = raw ? JSON.parse(raw) : [];
      const existingIds = new Set(existing.map((o) => o.id));
      const missing = jsonOrders.filter((o) => !existingIds.has(o.id));
      if (missing.length > 0) {
        localStorage.setItem(key, JSON.stringify([...existing, ...missing]));
      }
    } catch { /* ignore */ }
  });

  // Read all orders from localStorage (includes JSON orders + cart orders with updated states)
  const pedidos: { estado: string }[] = Object.keys(localStorage)
    .filter((key) => key.startsWith("orders-"))
    .flatMap((key) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
        return Array.isArray(parsed) ? (parsed as { estado: string }[]) : [];
      } catch {
        return [];
      }
    });

  const statCategories = document.getElementById("stat-categories");
  const statProducts = document.getElementById("stat-products");
  const statAvailable = document.getElementById("stat-available");
  const statOrders = document.getElementById("stat-orders");
  const ordersByStatusEl = document.getElementById("orders-by-status");

  if (statCategories) statCategories.textContent = String(categories.length);
  if (statProducts) statProducts.textContent = String(products.length);
  if (statAvailable) {
    statAvailable.textContent = String(products.filter((p) => p.disponible && p.stock > 0).length);
  }
  if (statOrders) statOrders.textContent = String(pedidos.length);

  if (ordersByStatusEl) {
    const statusCount: Record<string, number> = {};
    pedidos.forEach((p) => {
      statusCount[p.estado] = (statusCount[p.estado] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      pending: "Pendiente",
      processing: "En preparación",
      completed: "Entregado",
      cancelled: "Cancelado",
    };

    ordersByStatusEl.innerHTML = Object.entries(statusCount)
      .map(
        ([estado, count]) =>
          `<li><span class="badge badge-${estado.toLowerCase()}">${statusLabels[estado] ?? estado}</span> ${count}</li>`,
      )
      .join("");
  }
};

initPage();
