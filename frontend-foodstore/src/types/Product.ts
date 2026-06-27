import type { ICategory } from "./ICategory";

export interface Product {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string;
  stock: number;
  imagen: string;
  disponible: boolean;
  categoria: ICategory;
}
