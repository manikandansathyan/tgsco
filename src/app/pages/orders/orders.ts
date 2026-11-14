
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

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private api = inject(Api);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  orders: any[] = [];

  loading = false;
  errorMessage = '';

  search = '';
  status = '';
  paymentStatus = '';
  from = '';
  to = '';

  sort: 'newest' | 'oldest' | 'total' = 'newest';

  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  statusOptions: string[] = [
    'pending_payment',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'returned',
    'cancelled',
    'refunded',
  ];

  paymentStatusOptions: string[] = [
    'pending',
    'created',
    'authorized',
    'captured',
    'failed',
    'refunded',
  ];

  ngOnInit(): void {
    this.loadFilters();
    this.loadOrders();
  }

  loadFilters(): void {
    this.api
      .getAdminOrderFilters()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          this.statusOptions = Array.isArray(data?.orderStatuses)
            ? data.orderStatuses
            : this.statusOptions;

          this.paymentStatusOptions = Array.isArray(data?.paymentStatuses)
            ? data.paymentStatuses
            : this.paymentStatusOptions;

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load order filters:', error);
          this.cdr.markForCheck();
        },
      });
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    const filters: any = {
      page: this.page,
      limit: this.limit,
      sort: this.sort,
    };

    if (this.search.trim()) {
      filters.search = this.search.trim();
    }

    if (this.status) {
      filters.status = this.status;
    }

    if (this.paymentStatus) {
      filters.paymentStatus = this.paymentStatus;
    }

    if (this.from) {
      filters.from = this.from;
    }

    if (this.to) {
      filters.to = this.to;
    }

    this.api
      .getAdminOrders(filters)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          const items =
            data?.items ??
            data?.orders ??
            data?.results ??
            data?.rows ??
            [];

          this.orders = Array.isArray(items) ? items : [];

          const pagination =
            data?.pagination ??
            data?.meta ??
            data?.pageInfo ??
            data;

          this.total = Number(
            pagination?.total ??
            pagination?.totalItems ??
            pagination?.count ??
            this.orders.length
          );

          this.page = Number(pagination?.page ?? this.page);
          this.limit = Number(pagination?.limit ?? this.limit);

          this.totalPages = Number(
            pagination?.pages ??
            pagination?.totalPages ??
            Math.max(1, Math.ceil(this.total / this.limit))
          );

          if (this.totalPages < 1) {
            this.totalPages = 1;
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.orders = [];
          this.total = 0;
          this.totalPages = 1;

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The request timed out. Please try again.'
              : error?.error?.message ??
                error?.message ??
                'Failed to load orders. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadOrders();
  }

  resetFilters(): void {
    this.search = '';
    this.status = '';
    this.paymentStatus = '';
    this.from = '';
    this.to = '';
    this.sort = 'newest';
    this.page = 1;

    this.loadOrders();
  }

  changePage(newPage: number): void {
    if (
      newPage < 1 ||
      newPage > this.totalPages ||
      newPage === this.page
    ) {
      return;
    }

    this.page = newPage;
    this.loadOrders();
  }

  changeLimit(newLimit: number | string): void {
    const parsedLimit = Number(newLimit);

    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      return;
    }

    this.limit = parsedLimit;
    this.page = 1;
    this.loadOrders();
  }

  viewOrder(order: any): void {
    const orderId = this.getOrderId(order);

    if (!orderId) {
      return;
    }

    this.router.navigate(['/orders', orderId]);
  }

  getOrderId(order: any): string {
    return String(order?._id ?? order?.id ?? '');
  }

  getOrderNumber(order: any): string {
    return (
      order?.orderNumber ??
      order?.orderNo ??
      order?.number ??
      this.getOrderId(order) ??
      '—'
    ) || '—';
  }

  getCustomerName(order: any): string {
    const customer = order?.customer ?? order?.user;
    const address = order?.shippingAddress;

    if (typeof customer === 'object' && customer !== null) {
      const fullName = [
        customer.firstName,
        customer.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      return (
        customer.name ||
        customer.fullName ||
        fullName ||
        address?.recipientName ||
        'Guest'
      );
    }

    return (
      address?.recipientName ||
      order?.customerName ||
      order?.name ||
      'Guest'
    );
  }

  getCustomerEmail(order: any): string {
    const customer = order?.customer ?? order?.user;

    return (
      (typeof customer === 'object' ? customer?.email : '') ||
      order?.customerEmail ||
      order?.email ||
      ''
    );
  }

  getCustomerMobile(order: any): string {
    const customer = order?.customer ?? order?.user;
    const address = order?.shippingAddress;

    return (
      address?.mobile ||
      address?.phone ||
      address?.recipientMobile ||
      (typeof customer === 'object'
        ? customer?.mobile ?? customer?.phone
        : '') ||
      order?.mobile ||
      order?.phone ||
      ''
    );
  }

  getOrderStatus(order: any): string {
    return (
      order?.orderStatus ??
      order?.status ??
      'pending'
    );
  }

  getPaymentStatus(order: any): string {
    return (
      order?.paymentStatus ??
      order?.payment?.status ??
      'pending'
    );
  }

  getReturnStatus(order: any): string {
    return (
      order?.returnStatus ??
      order?.return?.status ??
      ''
    );
  }

  getPaymentMethod(order: any): string {
    const method =
      order?.paymentMethod ??
      order?.payment?.method ??
      order?.paymentMethodName;

    return method ? String(method) : '—';
  }

  getOrderTotal(order: any): number {
    const total =
      order?.grandTotal ??
      order?.totalAmount ??
      order?.total ??
      order?.amount ??
      0;

    const parsed = Number(total);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  getOrderCurrency(order: any): string {
    return (
      order?.currency ??
      order?.items?.[0]?.currency ??
      order?.payment?.currency ??
      'INR'
    );
  }

  getOrderDate(order: any): Date | string {
    return (
      order?.createdAt ??
      order?.orderDate ??
      order?.date ??
      ''
    );
  }

  getItemCount(order: any): number {
    const items = order?.items;

    if (!Array.isArray(items)) {
      return Number(order?.itemCount ?? 0);
    }

    return items.reduce(
      (total: number, item: any) =>
        total + Number(item?.quantity ?? 1),
      0
    );
  }

  getItemSummary(order: any): string {
    const items = order?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return 'No items';
    }

    const firstItem = items[0];
    const name =
      firstItem?.name ??
      firstItem?.productName ??
      firstItem?.title ??
      'Product';

    if (items.length === 1) {
      return name;
    }

    return `${name} + ${items.length - 1} more`;
  }

  formatStatus(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  }

  formatCurrency(
    amount: number | string | null | undefined,
    currency = 'INR'
  ): string {
    const value = Number(amount ?? 0);

    if (!Number.isFinite(value)) {
      return '—';
    }

    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  trackByOrder(index: number, order: any): string | number {
    return order?._id ?? order?.id ?? index;
  }
}
