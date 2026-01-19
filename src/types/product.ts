export interface Product {
  id: number;
  code: string;
  short_code: string | null;
  description: string;
  stock: number;
  category: 'herramienta' | 'consumible';
  createdAt: string;
  updatedAt: string;
}