
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface CatalogueCategory {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  groupId?: string | {
    _id?: string;
    name?: string;
  };
  group?: {
    _id?: string;
    name?: string;
  };
  description?: string;
  subtitle?: string;
  type?: string;
  active?: boolean;
  image?: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  categories: CatalogueCategory[] = [];

  isLoading = false;
  isDeleting = false;
  deletingId: string | null = null;

  selectedType = '';

  errorMessage = '';
  successMessage = '';

 

  constructor(
    private api: Api,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(type?: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedType = type ?? '';

    this.api
      .getCatalogueCategoriesAPI(this.selectedType || undefined)
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

          this.categories = Array.isArray(data?.categories)
            ? data.categories
            : Array.isArray(data)
              ? data
              : [];

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Catalogue Categories API error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ?? 'Unable to load catalogue categories.';

          this.categories = [];
          this.cdr.markForCheck();
        },
      });
  }

  getCategoryId(category: CatalogueCategory): string {
    return String(category?._id || category?.id || '');
  }

  getCategoryName(category: CatalogueCategory): string {
    return category?.name || 'Untitled Category';
  }

  getCategoryStatus(category: CatalogueCategory): string {
    return category?.active === false ? 'Inactive' : 'Active';
  }

  getCategoryGroup(category: CatalogueCategory): string {
    if (typeof category?.groupId === 'object' && category.groupId !== null) {
      return category.groupId.name || '—';
    }

    return category?.group?.name || '—';
  }

  getCategoryType(category: CatalogueCategory): string {
    if (!category?.type) {
      return '—';
    }

    return category.type.charAt(0).toUpperCase() + category.type.slice(1);
  }

  viewCategory(category: CatalogueCategory): void {
    const id = this.getCategoryId(category);

    this.router.navigate(['/catalogue/categories'], {
      queryParams: {
        ...(id ? { id } : {}),
        ...(category.type ? { type: category.type } : {}),
      },
    });
  }

  deleteCategory(category: CatalogueCategory): void {
    const id = this.getCategoryId(category);

    if (!id) {
      this.errorMessage =
        'Unable to delete category. Category ID is missing.';
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${this.getCategoryName(category)}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.deletingId = id;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteCatalogueCategoryAPI(id)
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
              response?.message || 'Failed to delete category.';
            return;
          }

          this.categories = this.categories.filter(
            (item) => this.getCategoryId(item) !== id
          );

          this.successMessage = 'Category deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Delete Catalogue Category API error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ?? 'Failed to delete category.';

          this.cdr.markForCheck();
        },
      });
  }

  trackById(index: number, category: CatalogueCategory): string | number {
    return category?._id || category?.id || index;
  }
}
