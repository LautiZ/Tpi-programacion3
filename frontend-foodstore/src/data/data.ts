import productosJson from "./productos.json";
import categoriasJson from "./categorias.json";
import type { Product } from "../types/Product";
import type { ICategory } from "../types/ICategory";

const PRODUCTS_KEY = "admin-products";
const CATEGORIES_KEY = "admin-categories";

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch { /* ignore */ }
  return fallback;
}

export const PRODUCTS: Product[] = loadFromStorage<Product>(
  PRODUCTS_KEY,
  productosJson as unknown as Product[],
);

export function getCategories(): ICategory[] {
  return loadFromStorage<ICategory>(CATEGORIES_KEY, categoriasJson as unknown as ICategory[]);
}
