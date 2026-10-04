import type { components } from './schema';

type Schemas = components['schemas'];

export type Product = Schemas['ProductDto'];
export type Category = Schemas['CategoryDto'];
export type Catalog = Schemas['CatalogDto'];
export type AdminCategory = Schemas['AdminCategoryDto'];
export type ProductInput = Schemas['ProductInput'];
export type ProductList = Schemas['ProductListDto'];
export type UploadedImage = Schemas['UploadedImageDto'];
export type Me = Schemas['MeResponse'];
