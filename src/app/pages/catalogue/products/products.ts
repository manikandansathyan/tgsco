
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface CatalogueProduct {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  sku?: string;
  categorySlug?: string;
  type?: string;
  price?: number;
  originalPrice?: number;
  stockQuantity?: number;
  active?: boolean;
  mainImage?: string;
  image?: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  products: CatalogueProduct[] = [];

  isLoading = false;
  isDeleting = false;
  deletingId: string | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private api: Api,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getCatalogueProductsAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          this.products = Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data)
              ? data
              : [];

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Catalogue Products API error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ?? 'Unable to load catalogue products.';

          this.products = [];
          this.cdr.markForCheck();
        },
      });
  }

  getProductId(product: CatalogueProduct): string {
    return String(product?._id || product?.id || '');
  }

  getProductName(product: CatalogueProduct): string {
    return product?.name || 'Untitled Product';
  }

  getProductStatus(product: CatalogueProduct): string {
    return product?.active === false ? 'Inactive' : 'Active';
  }

  viewProduct(product: CatalogueProduct): void {
    const id = this.getProductId(product);

    this.router.navigate(['/catalogue/products'], {
      queryParams: id ? { id } : {},
    });
  }

  deleteProduct(product: CatalogueProduct): void {
    const id = this.getProductId(product);

    if (!id) {
      this.errorMessage = 'Unable to delete product. Product ID is missing.';
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${this.getProductName(product)}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.deletingId = id;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteCatalogueProductAPI(id)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.deletingId = null;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.errorMessage =
              response?.message || 'Failed to delete product.';
            return;
          }

          this.products = this.products.filter(
            (item) => this.getProductId(item) !== id
          );

          this.successMessage = 'Product deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Delete Catalogue Product API error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ?? 'Failed to delete product.';

          this.cdr.markForCheck();
        },
      });
  }

  trackById(index: number, product: CatalogueProduct): string | number {
    return product?._id || product?.id || index;
  }
}
