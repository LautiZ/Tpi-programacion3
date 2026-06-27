import { PRODUCTS } from "../data/data";

export function addCart(e: Event, userEmail: string) {
  const target = e.target as HTMLElement | null;
  const form = target?.closest(".add-to-cart-form") as HTMLFormElement | null;

  if (!form) return;

  e.preventDefault();

  const productIdInput = form.querySelector(
    "input[name='product_id']",
  ) as HTMLInputElement | null;

  if (!productIdInput) return;

  const quantityInput = form.querySelector(
    "#quantity",
  ) as HTMLInputElement | null;

  if (!quantityInput) return;

  console.log("Producto agregado al carrito, ID:", productIdInput.value);
  console.log("Cantidad:", quantityInput.value);

  const selectedProduct = PRODUCTS.find(
    (product) => product.id === parseInt(productIdInput.value),
  );

  const cartKey = `cart-${userEmail}`;
  const existingCart = localStorage.getItem(cartKey) ?? null;
  let cart = existingCart ? JSON.parse(existingCart) : [];

  const existingItemIndex = cart.findIndex(
    (item: { product?: { id?: number } }) =>
      item?.product?.id === selectedProduct?.id,
  );

  console.log("Índice del producto en el carrito:", existingItemIndex);

  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += parseFloat(quantityInput.value);
  } else {
    cart.push({
      product: selectedProduct,
      quantity: parseFloat(quantityInput.value),
    });
  }

  localStorage.setItem(cartKey, JSON.stringify(cart));

  const linkCart = document.getElementById(
    "linkCart",
  ) as HTMLAnchorElement | null;
  if (linkCart) {
    linkCart.innerHTML = `Carrito <span class="cart-count">${cart.length}</span>`;
  }
}
