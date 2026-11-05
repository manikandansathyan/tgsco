
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.css',
})
export class Catalogue implements OnInit {
  groups: any[] = [];
  categories: any[] = [];
  products: any[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private api: Api,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCatalogue();
  }

  private getItems(response: any, key: string): any[] {
    const result =
      response?.data?.[key] ??
      response?.[key] ??
      response?.data?.items ??
      response?.items ??
      response?.data;

    const items = Array.isArray(result)
      ? result
      : result && typeof result === 'object'
        ? [result]
        : [];

    return items;
  }

  loadCatalogue(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    let completedRequests = 0;
    const failedRequests: string[] = [];

    const finishLoading = (): void => {
      completedRequests++;

      if (completedRequests === 3) {
        this.loading = false;

        if (failedRequests.length > 0) {
          this.errorMessage =
            'Unable to load ' +
            failedRequests.join(', ') +
            '. Please try refreshing the catalogue.';
        }
      }

      this.cdr.markForCheck();
    };

    this.api
      .getCatalogueGroupsAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          finishLoading();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.groups = [];
            failedRequests.push('catalogue groups');
          } else {
            this.groups = this.getItems(response, 'groups');
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Catalogue groups API error:', error);
          this.groups = [];
          failedRequests.push('catalogue groups');
          this.cdr.markForCheck();
        },
      });

    this.api
      .getCatalogueCategoriesAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          finishLoading();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.categories = [];
            failedRequests.push('catalogue categories');
          } else {
            this.categories = this.getItems(response, 'categories');
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Catalogue categories API error:', error);
          this.categories = [];
          failedRequests.push('catalogue categories');
          this.cdr.markForCheck();
        },
      });

    this.api
      .getCatalogueProductsAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          finishLoading();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.products = [];
            failedRequests.push('catalogue products');
          } else {
            this.products = this.getItems(response, 'products');
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Catalogue products API error:', error);
          this.products = [];
          failedRequests.push('catalogue products');
          this.cdr.markForCheck();
        },
      });
  }

  viewDetails(
    section: 'groups' | 'categories' | 'products'
  ): void {
    this.router.navigate(['/catalogue', section]);
  }

  createNew(
    section: 'groups' | 'categories' | 'products'
  ): void {
    this.router.navigate(['/catalogue', section], {
      queryParams: { action: 'create' },
    });
  }

  viewCategories(
    type: 'weaves' | 'occasions' | 'fabric'
  ): void {
    this.router.navigate(['/catalogue/categories', type]);
  }

  getName(item: any): string {
    return item?.name || item?.title || item?.slug || 'Untitled';
  }

  getDescription(item: any): string {
    return (
      item?.description ||
      item?.shortDescription ||
      'No description available'
    );
  }

  getId(item: any): string {
    return item?._id || item?.id || '';
  }

  getStatus(item: any): string {
    return item?.active === false ? 'Inactive' : 'Active';
  }

  getCategoryType(item: any): string {
    return item?.type || item?.group?.name || '—';
  }

  getGroupName(category: any): string {
    const group = category?.group;

    if (group && typeof group === 'object') {
      return group.name || '—';
    }

    const matchedGroup = this.groups.find(
      (item: any) =>
        item?._id === group || item?.id === group
    );

    return matchedGroup?.name || category?.groupName || '—';
  }

  getProductCategory(product: any): string {
    if (
      Array.isArray(product?.categories) &&
      product.categories.length > 0
    ) {
      return product.categories
        .map((category: any) => category?.name)
        .filter(Boolean)
        .join(', ');
    }

    return (
      product?.categoryName ||
      product?.categorySlug ||
      product?.category ||
      '—'
    );
  }

  getProductCategoryNames(product: any): string {
    if (
      Array.isArray(product?.categories) &&
      product.categories.length > 0
    ) {
      return product.categories
        .map((category: any) => category?.name)
        .filter(Boolean)
        .join(', ');
    }

    if (
      Array.isArray(product?.categoryNames) &&
      product.categoryNames.length > 0
    ) {
      return product.categoryNames.join(', ');
    }

    return (
      product?.categoryName ||
      product?.categorySlug ||
      product?.category ||
      '—'
    );
  }

  getProductTypes(product: any): string {
    if (
      Array.isArray(product?.types) &&
      product.types.length > 0
    ) {
      return product.types.join(', ');
    }

    return product?.type || '—';
  }

  getProductPrice(product: any): string {
    const price = Number(product?.price);

    if (
      product?.price === null ||
      product?.price === undefined ||
      product?.price === '' ||
      !Number.isFinite(price)
    ) {
      return '—';
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: product?.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  }

  getStockQuantity(product: any): number | string {
    const stock = Number(product?.stockQuantity);

    if (
      product?.stockQuantity === null ||
      product?.stockQuantity === undefined ||
      product?.stockQuantity === '' ||
      !Number.isFinite(stock)
    ) {
      return '—';
    }

    return stock;
  }

  trackById = (index: number, item: any): string | number => {
    return item?._id || item?.id || index;
  };
}
