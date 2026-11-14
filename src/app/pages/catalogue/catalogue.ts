import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../core/services/api';

interface CatalogueGroup {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  active?: boolean;
  sortOrder?: number;
}

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.css',
})
export class Catalogue implements OnInit {
  groups: CatalogueGroup[] = [];

  loading = false;
  deletingId: string | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private api: Api,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api
      .getCatalogueGroupsAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          this.groups = Array.isArray(data?.groups)
            ? data.groups
            : Array.isArray(data)
              ? data
              : [];

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Catalogue Groups API error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ?? 'Unable to load catalogue groups.';

          this.groups = [];
          this.cdr.markForCheck();
        },
      });
  }

  getGroupId(group: CatalogueGroup): string {
    return String(group?._id || group?.id || '');
  }

  getGroupName(group: CatalogueGroup): string {
    return group?.name || 'Untitled Group';
  }

  getGroupDescription(group: CatalogueGroup): string {
    return group?.description || 'No description available';
  }

  getGroupStatus(group: CatalogueGroup): string {
    return group?.active === false ? 'Inactive' : 'Active';
  }

  viewGroup(group: CatalogueGroup): void {
    const id = this.getGroupId(group);

    this.router.navigate(['/catalogue/groups'], {
      queryParams: id ? { id } : {},
    });
  }

  deleteGroup(group: CatalogueGroup): void {
    const id = this.getGroupId(group);

    if (!id) {
      this.errorMessage = 'Unable to delete this group. Group ID is missing.';
      return;
    }

    const name = this.getGroupName(group);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.deletingId = id;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteCatalogueGroupAPI(id)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.errorMessage =
              response?.message || 'Failed to delete catalogue group.';
            return;
          }

          this.successMessage = 'Catalogue group deleted successfully.';

          this.groups = this.groups.filter(
            (item) => this.getGroupId(item) !== id
          );

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error deleting catalogue group:', error);

          this.errorMessage =
            error?.error?.message ||
            (error?.name === 'TimeoutError'
              ? 'Delete request timed out. Please try again.'
              : 'Failed to delete catalogue group.');

          this.cdr.markForCheck();
        },
      });
  }

  trackById(index: number, group: CatalogueGroup): string | number {
    return group?._id || group?.id || index;
  }
}
