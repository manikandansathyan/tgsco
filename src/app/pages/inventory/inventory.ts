
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, finalize, timeout } from 'rxjs';
import { Api } from '../../core/services/api';

interface InventoryItem {
  productId: string;
  sku: string;
  name: string;
  barcode?: string;
  active: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | string;
}

interface InventorySummary {
  products: number;
  totalStock: number;
  totalReserved: number;
  totalAvailable: number;
  lowStock: number;
  outOfStock: number;
}

interface InventoryResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

type OperationType =
  | 'restock'
  | 'adjust'
  | 'damage'
  | 'return'
  | 'reconcile';

interface OperationForm {
  quantity: number | null;
  direction: 'increase' | 'decrease';
  physicalQuantity: number | null;
  reason: string;
  note: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  unitCost: number | null;
  receivedAt: string;
  referenceId: string;
  referenceType: string;
  returnId: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  inventory: InventoryItem[] = [];

  summary: InventorySummary = {
    products: 0,
    totalStock: 0,
    totalReserved: 0,
    totalAvailable: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  search = '';
  statusFilter = 'all';
  activeFilter = 'all';
  sort = 'newest';

  page = 1;
  limit = 10;
  total = 0;
  pages = 0;

  loading = false;
  summaryLoading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showOperationModal = false;
  operationType: OperationType = 'restock';
  operationProduct: InventoryItem | null = null;

  form: OperationForm = this.createEmptyForm();

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadInventory();
  }

  private createEmptyForm(): OperationForm {
    return {
      quantity: null,
      direction: 'increase',
      physicalQuantity: null,
      reason: '',
      note: '',
      supplierName: '',
      supplierInvoiceNumber: '',
      unitCost: null,
      receivedAt: '',
      referenceId: '',
      referenceType: '',
      returnId: '',
    };
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

  // Inventory Summary
  loadSummary(): void {
    this.summaryLoading = true;

    this.api
      .getAdminInventorySummary()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.summaryLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = this.extractData<InventorySummary>(response);

          this.summary = {
            products: Number(result?.products) || 0,
            totalStock: Number(result?.totalStock) || 0,
            totalReserved: Number(result?.totalReserved) || 0,
            totalAvailable: Number(result?.totalAvailable) || 0,
            lowStock: Number(result?.lowStock) || 0,
            outOfStock: Number(result?.outOfStock) || 0,
          };
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            'Unable to load inventory summary.';
        },
      });
  }

  // Inventory List
  loadInventory(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api
      .getAdminInventory(
        this.search.trim() || undefined,
        this.statusFilter === 'all' ? undefined : this.statusFilter,
        this.activeFilter === 'all' ? undefined : this.activeFilter,
        this.sort,
        this.page,
        this.limit
      )
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = this.extractData<InventoryResponse>(response);

          this.inventory = Array.isArray(result?.items)
            ? result.items
            : [];

          this.total = Number(result?.total) || 0;
          this.page = Number(result?.page) || this.page;
          this.limit = Number(result?.limit) || this.limit;
          this.pages = Number(result?.pages) || 0;
        },
        error: (error: any) => {
          this.inventory = [];
          this.total = 0;
          this.pages = 0;

          this.errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            'Unable to load inventory. Please try again.';
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadInventory();
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'all';
    this.activeFilter = 'all';
    this.sort = 'newest';
    this.page = 1;
    this.successMessage = '';
    this.errorMessage = '';

    this.loadInventory();
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.pages || this.loading) {
      return;
    }

    this.page = newPage;
    this.loadInventory();
  }

  changeLimit(value: number | string): void {
    const newLimit = Number(value);

    if (!Number.isFinite(newLimit) || newLimit < 1) {
      return;
    }

    this.limit = newLimit;
    this.page = 1;
    this.loadInventory();
  }

  get firstItem(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1;
  }

  get lastItem(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  get pageNumbers(): number[] {
    const result: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.pages, this.page + 2);

    for (let current = start; current <= end; current++) {
      result.push(current);
    }

    return result;
  }

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

  trackByProductId(_index: number, item: InventoryItem): string {
    return item.productId;
  }

  openOperation(type: OperationType, item: InventoryItem): void {
    this.operationType = type;
    this.operationProduct = item;
    this.form = this.createEmptyForm();

    this.errorMessage = '';
    this.successMessage = '';

    if (type === 'reconcile') {
      this.form.physicalQuantity = item.stockQuantity;
    }

    this.showOperationModal = true;
  }

  closeOperation(): void {
    if (this.saving) {
      return;
    }

    this.showOperationModal = false;
    this.operationProduct = null;
    this.form = this.createEmptyForm();
  }

  get operationTitle(): string {
    const titles: Record<OperationType, string> = {
      restock: 'Restock Inventory',
      adjust: 'Adjust Stock',
      damage: 'Record Damaged Stock',
      return: 'Record Stock Return',
      reconcile: 'Reconcile Physical Stock',
    };

    return titles[this.operationType];
  }

  get operationDescription(): string {
    const descriptions: Record<OperationType, string> = {
      restock: 'Record stock received from a supplier.',
      adjust: 'Manually increase or decrease the stock quantity.',
      damage: 'Remove damaged or unusable items from available stock.',
      return: 'Record returned stock according to your inventory process.',
      reconcile: 'Set the inventory quantity to the physical count.',
    };

    return descriptions[this.operationType];
  }

  submitOperation(): void {
    const product = this.operationProduct;

    if (!product || this.saving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const reason = this.form.reason.trim();
    const note = this.form.note.trim();
    const quantity = Number(this.form.quantity);
    const referenceId = this.form.referenceId.trim() || undefined;
    const operation = this.operationType;

    if (!reason) {
      this.errorMessage = 'Please enter a reason for this operation.';
      return;
    }

    if (
      operation !== 'reconcile' &&
      (this.form.quantity === null ||
        !Number.isFinite(quantity) ||
        quantity <= 0)
    ) {
      this.errorMessage = 'Quantity must be greater than zero.';
      return;
    }

    if (
      operation === 'reconcile' &&
      (this.form.physicalQuantity === null ||
        !Number.isFinite(Number(this.form.physicalQuantity)) ||
        Number(this.form.physicalQuantity) < 0)
    ) {
      this.errorMessage = 'Enter a valid physical stock quantity.';
      return;
    }

    if (
      operation === 'restock' &&
      this.form.unitCost !== null &&
      (!Number.isFinite(Number(this.form.unitCost)) ||
        Number(this.form.unitCost) < 0)
    ) {
      this.errorMessage = 'Unit cost cannot be negative.';
      return;
    }

    let request!: Observable<any>;

    switch (operation) {
      case 'restock':
        request = this.api.restockAdminInventory(product.productId, {
          quantity,
          reason,
          note: note || undefined,
          supplierName: this.form.supplierName.trim() || undefined,
          supplierInvoiceNumber:
            this.form.supplierInvoiceNumber.trim() || undefined,
          unitCost:
            this.form.unitCost === null
              ? undefined
              : Number(this.form.unitCost),
          receivedAt: this.form.receivedAt || undefined,
          referenceId,
        });
        break;

      case 'adjust':
        request = this.api.adjustAdminInventory(product.productId, {
          direction: this.form.direction,
          quantity,
          reason,
          note: note || undefined,
          referenceType: this.form.referenceType.trim() || undefined,
          referenceId,
        });
        break;

      case 'damage':
        request = this.api.damageAdminInventory(product.productId, {
          quantity,
          reason,
          note: note || undefined,
          referenceId,
        });
        break;

      case 'return':
        request = this.api.returnAdminInventory(product.productId, {
          quantity,
          reason,
          note: note || undefined,
          returnId: this.form.returnId.trim() || undefined,
        });
        break;

      case 'reconcile':
        request = this.api.reconcileAdminInventory(product.productId, {
          physicalQuantity: Number(this.form.physicalQuantity),
          reason,
          note: note || undefined,
        });
        break;
    }

    this.saving = true;

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = this.extractData<any>(response);

          this.showOperationModal = false;
          this.operationProduct = null;
          this.form = this.createEmptyForm();

          this.successMessage =
            result?.message ||
            response?.message ||
            `${this.getOperationSuccessLabel(operation)} completed successfully.`;

          this.loadInventory();
          this.loadSummary();
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            `Unable to complete ${operation}. Please try again.`;
        },
      });
  }

  private getOperationSuccessLabel(type: OperationType): string {
    const labels: Record<OperationType, string> = {
      restock: 'Stock restock',
      adjust: 'Stock adjustment',
      damage: 'Damage recording',
      return: 'Stock return',
      reconcile: 'Stock reconciliation',
    };

    return labels[type];
  }
}
