import { getCategories, PRODUCTS } from "../data/data";
import type { Product } from "../types/Product";

export type CartItem = {
  product: Product;
  quantity: number;
};

export function renderCategories(categoriesContainer: HTMLElement | null) {
  if (!categoriesContainer) return;

  const categories = getCategories();

  categories.forEach((category) => {
    const li = document.createElement("li");
    const anchor = document.createElement("a");

    anchor.href = `?categoria=${category.nombre}`;
    anchor.setAttribute("data-category", category.id.toString());
    anchor.textContent = category.nombre;

    li.appendChild(anchor);
    categoriesContainer.appendChild(li);
  });
}

export function renderProducts(
  filter: string,
  categoryFilter = "",
  productsContainer: HTMLElement | null,
  cartItems: CartItem[] | null = null,
  sort = "",
  disponibilidad = "",
): number {
  if (!productsContainer) return 0;

  const normalizedFilter = filter.trim().toLowerCase();
  const normalizedCategory = categoryFilter.trim().toLowerCase();

  let filteredProducts: Product[];

  if (cartItems) {
    filteredProducts = cartItems
      .map((item) => item.product)
      .filter((product) => {
        const matchesText =
          !normalizedFilter ||
          product.nombre.toLowerCase().includes(normalizedFilter) ||
          product.descripcion.toLowerCase().includes(normalizedFilter);

        const matchesCategory =
          !normalizedCategory ||
          product.categoria.nombre.toLowerCase() === normalizedCategory;

        return matchesText && matchesCategory;
      });
  } else {
    filteredProducts = PRODUCTS.filter((product) => {
      const matchesText =
        !normalizedFilter ||
        product.nombre.toLowerCase().includes(normalizedFilter) ||
        product.descripcion.toLowerCase().includes(normalizedFilter);

      const matchesCategory =
        !normalizedCategory ||
        product.categoria.nombre.toLowerCase() === normalizedCategory;

      return matchesText && matchesCategory;
    });
  }

  if (disponibilidad === "true") {
    filteredProducts = filteredProducts.filter((p) => p.disponible && p.stock > 0);
  } else if (disponibilidad === "false") {
    filteredProducts = filteredProducts.filter((p) => !p.disponible || p.stock === 0);
  }

  if (sort === "precio-asc") filteredProducts.sort((a, b) => a.precio - b.precio);
  else if (sort === "precio-desc") filteredProducts.sort((a, b) => b.precio - a.precio);
  else if (sort === "nombre") filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML =
      "<p class='no-results'>No se encontraron productos.</p>";
    return 0;
  }

  if (!cartItems) {
    productsContainer.innerHTML = filteredProducts
      .map((product) => {
        const title = product.disponible
          ? `<h3>${product.nombre}</h3>`
          : `<h3 class="text-unavailable">${product.nombre}</h3>`;

        const availabilityBadge =
          product.disponible && product.stock > 0
            ? `<span class="badge-disponible">Disponible</span>`
            : `<span class="badge-agotado">Sin stock</span>`;

        return `
      <a class="producto-card" href="/src/pages/store/productDetail/productDetail.html?id=${product.id}">
        <img src="${product.imagen}" alt="${product.nombre}" />
        <span class="product-category-badge">${product.categoria.nombre}</span>
        ${title}
        <p class="descripcion">${product.descripcion}</p>
        <div class="card-bottom">
          <p class="precio">$${product.precio.toFixed(2)}</p>
          ${availabilityBadge}
        </div>
      </a>
    `;
      })
      .join("");
    return filteredProducts.length;
  } else {
    productsContainer.innerHTML = filteredProducts
      .map((product) => {
        const quantity =
          cartItems.find((item) => item.product.id === product.id)?.quantity ??
          0;

        return `
      <article class="producto-card cart-item" data-product-id="${product.id}">
        <img src="${product.imagen}" alt="${product.nombre}" />
        <div class="cart-item-info">
          <h3>${product.nombre}</h3>
          <p class="precio-unitario">$${product.precio.toFixed(2)} c/u</p>
          <div class="cart-qty-controls">
            <button type="button" class="btn-qty-decrease" data-id="${product.id}">-</button>
            <span class="qty-display">${quantity}</span>
            <button type="button" class="btn-qty-increase" data-id="${product.id}" data-stock="${product.stock}">+</button>
          </div>
          <p class="subtotal">Subtotal: $${(product.precio * quantity).toFixed(2)}</p>
        </div>
        <button type="button" class="btn-remove-item" data-id="${product.id}">Eliminar</button>
      </article>
    `;
      })
      .join("");
    return filteredProducts.length;
  }
}
