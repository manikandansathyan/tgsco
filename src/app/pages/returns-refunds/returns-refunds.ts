
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../core/services/api';

interface ReturnOrder {
  _id?: string;
  orderNumber?: string;
  paymentMethod?: string;
  orderStatus?: string;
  paymentStatus?: string;
}

interface ReturnProduct {
  productId?: string;
  quantity?: number;
  name?: string;
  sku?: string;
  unitPrice?: number;
  lineTotal?: number;
}

interface PickupAddress {
  recipientName?: string;
  mobile?: string;
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface RefundMethod {
  method?: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  label?: string;
}

interface ReturnTimeline {
  status?: string;
  message?: string;
  by?: string;
  at?: string;
}

interface ReturnItem {
  _id?: string;
  order?: ReturnOrder;
  user?: string;
  items?: ReturnProduct[];
  reason?: string;
  customerNote?: string;
  pickupAddress?: PickupAddress;
  refundMethodId?: string | null;
  refundMethod?: RefundMethod | null;
  status?: string;
  refund?: any;
  timeline?: ReturnTimeline[];
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

interface ReturnFilters {
  statuses?: string[];
  reasons?: string[];
  paymentMethods?: string[];
  paymentStatuses?: string[];
}

@Component({
  selector: 'app-returns-refunds',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns-refunds.html',
  styleUrl: './returns-refunds.css',
})
export class ReturnsRefunds implements OnInit {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  returns: ReturnItem[] = [];
  filterOptions: ReturnFilters = {};

  loading = false;
  filtersLoading = false;
  updatingId: string | null = null;

  errorMessage = '';
  successMessage = '';

  status = '';
  reason = '';
  paymentMethod = '';
  paymentStatus = '';
  from = '';
  to = '';
  sort: 'newest' | 'oldest' = 'newest';

  page = 1;
  limit = 20;
  totalPages = 1;
  totalReturns = 0;

  ngOnInit(): void {
    this.loadFilters();
    this.loadReturns();
  }

  // Get returns with filters and pagination
  loadReturns(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const filters = {
      status: this.status,
      reason: this.reason,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      from: this.from,
      to: this.to,
      page: this.page,
      limit: this.limit,
      sort: this.sort,
    };

    this.api.getAdminReturnsWithFilters(filters).pipe(
      timeout(60000),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response: any) => {
        const payload = response?.data ?? response;

        const list = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.returns)
            ? payload.returns
            : Array.isArray(payload)
              ? payload
              : [];

        this.returns = list;

        this.totalReturns = Number(
          payload?.total ??
          payload?.pagination?.total ??
          list.length
        );

        this.page = Number(
          payload?.page ??
          payload?.pagination?.page ??
          this.page
        );

        this.limit = Number(
          payload?.limit ??
          payload?.pagination?.limit ??
          this.limit
        );

        this.totalPages = Math.max(
          1,
          Number(
            payload?.pages ??
            payload?.totalPages ??
            payload?.pagination?.pages ??
            Math.ceil(this.totalReturns / this.limit)
          )
        );
      },
      error: (error: any) => {
        this.returns = [];
        this.totalReturns = 0;
        this.totalPages = 1;

        this.errorMessage =
          error?.error?.error?.message ||
          error?.error?.message ||
          (error?.name === 'TimeoutError'
            ? 'Request timed out. Please try again.'
            : 'Unable to load return requests.');
      },
    });
  }

  // Get available filter options
  loadFilters(): void {
    this.filtersLoading = true;

    this.api.getAdminReturnFilters().pipe(
      timeout(60000),
      finalize(() => {
        this.filtersLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response: any) => {
        this.filterOptions = response?.data ?? response ?? {};
      },
      error: () => {
        this.filterOptions = {};
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadReturns();
  }

  clearFilters(): void {
    this.status = '';
    this.reason = '';
    this.paymentMethod = '';
    this.paymentStatus = '';
    this.from = '';
    this.to = '';
    this.sort = 'newest';
    this.page = 1;

    this.loadReturns();
  }

  changeSort(value: string): void {
    this.sort = value === 'oldest' ? 'oldest' : 'newest';
    this.page = 1;
    this.loadReturns();
  }

  changeLimit(value: string | number): void {
    this.limit = Number(value) || 20;
    this.page = 1;
    this.loadReturns();
  }

  previousPage(): void {
    if (this.page > 1 && !this.loading) {
      this.page--;
      this.loadReturns();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages && !this.loading) {
      this.page++;
      this.loadReturns();
    }
  }

  getReturnId(item: ReturnItem): string {
    return String(item._id ?? '');
  }

  getOrderNumber(item: ReturnItem): string {
    return item.order?.orderNumber || item.order?._id || '—';
  }

  getCustomerName(item: ReturnItem): string {
    return item.pickupAddress?.recipientName || '—';
  }

  getCustomerMobile(item: ReturnItem): string {
    return item.pickupAddress?.mobile || '—';
  }

  getProductNames(item: ReturnItem): string {
    if (!item.items?.length) {
      return '—';
    }

    return item.items
      .map(product => product.name || 'Product')
      .join(', ');
  }

  getAmount(item: ReturnItem): number {
    if (!item.items?.length) {
      return Number(item.refund?.amount ?? 0);
    }

    return item.items.reduce((total, product) => {
      const lineTotal = Number(product.lineTotal ?? 0);
      const unitPrice = Number(product.unitPrice ?? 0);
      const quantity = Number(product.quantity ?? 0);

      return total + (
        product.lineTotal != null
          ? lineTotal
          : unitPrice * quantity
      );
    }, 0);
  }

  getDate(item: ReturnItem): string {
    return item.createdAt || item.updatedAt || '';
  }

  formatStatus(value?: string): string {
    if (!value) {
      return '—';
    }

    return value
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  statusClass(value?: string): string {
    switch ((value ?? '').toLowerCase()) {
      case 'approved':
      case 'approved_for_refund':
      case 'received':
        return 'status-approved';

      case 'refunded':
      case 'completed':
        return 'status-completed';

      case 'rejected':
      case 'cancelled':
        return 'status-rejected';

      case 'requested':
      case 'pickup_pending':
      case 'inspection_pending':
      case 'refund_pending':
        return 'status-pending';

      default:
        return 'status-default';
    }
  }

  // Navigate to return details using its return ID
  openDetails(item: ReturnItem): void {
    const returnId = this.getReturnId(item);

    if (!returnId) {
      this.errorMessage = 'Return ID not found.';
      return;
    }

    this.router.navigate(['/returns-refunds', returnId]);
  }

  // Approve a requested return
  approveReturn(item: ReturnItem): void {
    const returnId = this.getReturnId(item);

    if (!returnId) {
      this.errorMessage = 'Return ID is missing.';
      return;
    }

    if (!window.confirm(`Are you sure you want to approve return ${returnId}?`)) {
      return;
    }

    this.updateStatus(item, {
      status: 'approved',
      message: 'Approved',
    });
  }

  // Update return status through the PATCH API
 
private updateStatus(
  item: ReturnItem,
  data: {
    status: string;
    message?: string;
    refundMethod?: string;
    refundReference?: string;
    refundAmount?: number;
    refundProcessedAt?: string;
    refundNotes?: string;
  }
): void {
  const returnId = this.getReturnId(item);

  if (!returnId) {
    this.errorMessage = 'Return ID is missing.';
    return;
  }

  this.updatingId = returnId;
  this.errorMessage = '';
  this.successMessage = '';

  if (data.status !== 'approved') {
    this.updatingId = null;
    this.errorMessage = 'Only return approval is available from this list.';
    return;
  }

  this.api.approveAdminReturn(returnId).pipe(
    timeout(60000),
    finalize(() => {
      this.updatingId = null;
      this.cdr.markForCheck();
    })
  ).subscribe({
    next: (response: any) => {
      this.successMessage =
        response?.message ||
        response?.data?.message ||
        'Return approved successfully.';

      this.loadReturns();
    },
    error: (error: any) => {
      this.errorMessage =
        error?.error?.error?.message ||
        error?.error?.message ||
        'Unable to approve return.';
    },
  });
}


  get statusOptions(): string[] {
    return this.toOptionArray(this.filterOptions.statuses);
  }

  get reasonOptions(): string[] {
    return this.toOptionArray(this.filterOptions.reasons);
  }

  get paymentMethodOptions(): string[] {
    return this.toOptionArray(this.filterOptions.paymentMethods);
  }

  get paymentStatusOptions(): string[] {
    return this.toOptionArray(this.filterOptions.paymentStatuses);
  }

  get pendingReturnsCount(): number {
    return this.returns.filter(
      item => item.status === 'requested'
    ).length;
  }

  private toOptionArray(value: any): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(option =>
        typeof option === 'string'
          ? option
          : String(option?.value ?? option?.name ?? option?.label ?? '')
      )
      .filter(Boolean);
  }
}
