
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface InventoryItem {
  productId: string;
  sku: string;
  name: string;
  barcode?: string | null;
  active: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderQuantity: number;
  status: string;
}

interface InventoryReservation {
  orderId: string;
  orderNumber: string;
  productId: string;
  quantity: number;
  orderStatus: string;
  paymentStatus: string;
  customer: {
    _id: string;
    email: string;
    name: string;
    mobile: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-inventory-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inventory-details.html',
  styleUrl: './inventory-details.css',
})
export class InventoryDetails implements OnInit {
  productId = '';

  product: InventoryItem | null = null;

  reservations: InventoryReservation[] = [];
  movements: any[] = [];

  loading = false;
  reservationsLoading = false;
  movementsLoading = false;

  errorMessage = '';

  movementType = 'all';
  from = '';
  to = '';

  movementPage = 1;
  movementLimit = 10;
  movementTotal = 0;
  movementPages = 0;

  reservationPage = 1;
  reservationLimit = 10;
  reservationTotal = 0;
  reservationPages = 0;

  constructor(
    private api: Api,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.productId) {
      this.errorMessage = 'Product ID was not found.';
      return;
    }

    this.loadProduct();
    this.loadReservations();
    this.loadMovements();
  }

  private extractData<T>(response: any): T {
    let result = response?.data ?? response;

    if (
      result &&
      typeof result === 'object' &&
      !Array.isArray(result) &&
      result.data !== undefined
    ) {
      result = result.data;
    }

    return result as T;
  }

  // Product Details
  loadProduct(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api
      .getAdminInventoryById(this.productId)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = this.extractData<any>(response);

          this.product =
            result?.item ??
            result?.product ??
            result ??
            null;
        },
        error: (error: any) => {
          this.product = null;

          this.errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            'Unable to load product details. Please try again.';
        },
      });
  }

  // Product Reservations
  loadReservations(): void {
    this.reservationsLoading = true;

    this.api
      .getAdminInventoryReservations(
        this.reservationPage,
        this.reservationLimit,
        this.productId
      )
      .pipe(
        timeout(60000),
        finalize(() => {
          this.reservationsLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = this.extractData<any>(response);

          // Actual API response: data is a direct array.
          if (Array.isArray(result)) {
            this.reservations = result;
            this.reservationTotal = result.length;
            this.reservationPage = 1;
            this.reservationPages = 1;
          } else {
            // Supports paginated response if backend changes.
            this.reservations = Array.isArray(result?.items)
              ? result.items
              : Array.isArray(result?.reservations)
                ? result.reservations
                : [];

            this.reservationTotal =
              Number(result?.total) || this.reservations.length;

            this.reservationPage =
              Number(result?.page) || this.reservationPage;

            this.reservationLimit =
              Number(result?.limit) || this.reservationLimit;

            this.reservationPages =
              Number(result?.pages) ||
              Math.ceil(
                this.reservationTotal / this.reservationLimit
              );
          }
        },
        error: (error: any) => {
          this.reservations = [];
          this.reservationTotal = 0;
          this.reservationPages = 0;

          this.errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            'Unable to load reservations.';
        },
      });
  }

  // Stock Movements
  loadMovements(): void {
    this.movementsLoading = true;

    this.api
      .getAdminInventoryMovements(
        this.productId,
        this.movementType === 'all' ? undefined : this.movementType,
        this.from || undefined,
        this.to || undefined,
        this.movementPage,
        this.movementLimit
      )
      .pipe(
        timeout(60000),
        finalize(() => {
          this.movementsLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = this.extractData<any>(response);

          this.movements = Array.isArray(result?.items)
            ? result.items
            : Array.isArray(result?.movements)
              ? result.movements
              : Array.isArray(result)
                ? result
                : [];

          this.movementTotal =
            Number(result?.total) || this.movements.length;

          this.movementPage =
            Number(result?.page) || this.movementPage;

          this.movementLimit =
            Number(result?.limit) || this.movementLimit;

          this.movementPages =
            Number(result?.pages) ||
            Math.ceil(this.movementTotal / this.movementLimit);
        },
        error: (error: any) => {
          this.movements = [];
          this.movementTotal = 0;
          this.movementPages = 0;

          this.errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            'Unable to load stock movements.';
        },
      });
  }

  // Refresh All Details
  refreshDetails(): void {
    this.loadProduct();
    this.loadReservations();
    this.loadMovements();
  }

  // Movement Filters
  applyMovementFilters(): void {
    this.movementPage = 1;
    this.loadMovements();
  }

  resetMovementFilters(): void {
    this.movementType = 'all';
    this.from = '';
    this.to = '';
    this.movementPage = 1;

    this.loadMovements();
  }

  // Movement Pagination
  changeMovementPage(page: number): void {
    if (
      page < 1 ||
      page > this.movementPages ||
      this.movementsLoading
    ) {
      return;
    }

    this.movementPage = page;
    this.loadMovements();
  }

  // Reservation Pagination
  changeReservationPage(page: number): void {
    if (
      page < 1 ||
      page > this.reservationPages ||
      this.reservationsLoading
    ) {
      return;
    }

    this.reservationPage = page;
    this.loadReservations();
  }

  // Product Status
  getStatusLabel(status: string): string {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return (status || 'Unknown').replace(/_/g, ' ');
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'in_stock':
        return 'status-in-stock';
      case 'low_stock':
        return 'status-low-stock';
      case 'out_of_stock':
        return 'status-out-of-stock';
      default:
        return 'status-default';
    }
  }

  // Order Status
  getOrderStatusLabel(status: string): string {
    return (status || 'Unknown')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // Payment Status
  getPaymentStatusLabel(status: string): string {
    return (status || 'Unknown')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // Movement Details
  getMovementLabel(value: string): string {
    return (value || 'Unknown')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getMovementQuantity(movement: any): number | string {
    return movement?.quantity ?? movement?.changeQuantity ?? '—';
  }

  getMovementDate(movement: any): string | null {
    return (
      movement?.createdAt ||
      movement?.movementDate ||
      movement?.date ||
      movement?.created_at ||
      null
    );
  }

  getReservationDate(
    reservation: InventoryReservation
  ): string | null {
    return reservation?.createdAt || null;
  }

  getMovementReference(movement: any): string {
    return (
      movement?.referenceId ||
      movement?.referenceType ||
      movement?.reference ||
      '—'
    );
  }

  // Track By
  trackById(index: number, item: any): string {
    return String(
      item?.id ??
      item?._id ??
      item?.orderId ??
      item?.productId ??
      index
    );
  }

  // Movement Page Numbers
  get movementPageNumbers(): number[] {
    const result: number[] = [];

    const start = Math.max(1, this.movementPage - 2);
    const end = Math.min(
      this.movementPages,
      this.movementPage + 2
    );

    for (let page = start; page <= end; page++) {
      result.push(page);
    }

    return result;
  }

  // Reservation Page Numbers
  get reservationPageNumbers(): number[] {
    const result: number[] = [];

    const start = Math.max(1, this.reservationPage - 2);
    const end = Math.min(
      this.reservationPages,
      this.reservationPage + 2
    );

    for (let page = start; page <= end; page++) {
      result.push(page);
    }

    return result;
  }
}
