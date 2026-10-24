
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

    if (Array.isArray(result)) {
      return result;
    }

    if (result && typeof result === 'object') {
      return [result];
    }

    return [];
  }

  loadCatalogue(): void {
    this.loading = true;
    this.errorMessage = '';

    let completed = 0;

    const finishLoading = (): void => {
      completed++;

      if (completed === 3) {
        this.loading = false;
      }

      this.cdr.markForCheck();
    };

    this.api
      .getCatalogueGroupsAPI()
      .pipe(
        timeout(60000),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe({
        next: (response: any) => {
          this.groups = this.getItems(response, 'groups');
          finishLoading();
        },
        error: (error: any) => {
          console.error('Catalogue groups API error:', error);
          this.groups = [];
          finishLoading();
        },
      });

    this.api
      .getCatalogueCategoriesAPI()
      .pipe(
        timeout(60000),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe({
        next: (response: any) => {
          this.categories = this.getItems(response, 'categories');
          finishLoading();
        },
        error: (error: any) => {
          console.error('Catalogue categories API error:', error);
          this.categories = [];
          finishLoading();
        },
      });

    this.api
      .getCatalogueProductsAPI()
      .pipe(
        timeout(60000),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe({
        next: (response: any) => {
          this.products = this.getItems(response, 'products');
          finishLoading();
        },
        error: (error: any) => {
          console.error('Catalogue products API error:', error);
          this.products = [];
          finishLoading();
        },
      });
  }

  viewDetails(section: 'groups' | 'categories' | 'products'): void {
    this.router.navigate(['/catalogue', section]);
  }

  createNew(section: 'groups' | 'categories' | 'products'): void {
    this.router.navigate(['/catalogue', section], {
      queryParams: { action: 'create' },
    });
  }

  viewCategories(type: 'weaves' | 'occasions' | 'fabric'): void {
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

  trackById(index: number, item: any): string | number {
    return this.getId(item) || index;
  }
}
