
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface ReturnOrder {
  _id?: string;
  orderNumber?: string;
  orderId?: string;
  totalAmount?: number;
  total?: number;
  customer?: {
    name?: string;
  };
}

interface RefundMethodDetails {
  type?: string;
  method?: string;
}

interface ReturnItem {
  _id?: string;
  id?: string;
  order?: ReturnOrder;
  reason?: string;

  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;

  refund?: any;
  refundAmount?: number;
  requestedAmount?: number;
  refundProcessedAt?: string;
  refundReference?: string;
  refundMethod?: RefundMethodDetails | null;

  description?: string;
  message?: string;
  requestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RefundPayload {
  refundMethod: string;
  refundReference: string;
  refundAmount: number;
  refundProcessedAt: string;
  refundNotes: string;
}

@Component({
  selector: 'app-returns-refunds-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns-refunds-details.html',
  styleUrl: './returns-refunds-details.css',
})
export class ReturnsRefundsDetails implements OnInit {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  returnItem: ReturnItem | null = null;

  updating = false;

  errorMessage = '';
  successMessage = '';

  // Refund form fields
  refundMethod = 'original_payment_method';
  refundAmount = 0;
  refundReference = '';
  refundProcessedAt = '';
  refundNotes = '';
  statusMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Return ID not found.';
      return;
    }

    this.loadReturnDetails(id);
  }

  // Return information
  get returnId(): string {
    return this.returnItem?._id || this.returnItem?.id || '';
  }

  get orderNumber(): string {
    return (
      this.returnItem?.order?.orderNumber ||
      this.returnItem?.order?.orderId ||
      this.returnItem?.order?._id ||
      '—'
    );
  }

  get customerName(): string {
    return (
      this.returnItem?.customer?.name ||
      this.returnItem?.order?.customer?.name ||
      'Customer'
    );
  }

  get amount(): number {
    return this.getAmount();
  }

  get status(): string {
    return this.returnItem?.status || 'requested';
  }

  get canApprove(): boolean {
    return this.status === 'requested';
  }

  get canRefund(): boolean {
    return [
      'approved',
      'received',
      'inspection_pending',
      'approved_for_refund',
      'refund_pending',
    ].includes(this.status);
  }

  get canComplete(): boolean {
    return this.status === 'refunded';
  }

  // Load return details
  loadReturnDetails(id: string): void {
    this.errorMessage = '';

    this.api
      .getAdminReturnsWithFilters({
        page: 1,
        limit: 100,
      })
      .pipe(
        timeout(60000),
        finalize(() => {
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const payload = response?.data;

          const items: ReturnItem[] = Array.isArray(payload)
            ? payload
            : payload?.items || [];

          this.returnItem =
            items.find(
              (item) =>
                item._id === id ||
                item.id === id
            ) || null;

          if (!this.returnItem) {
            this.errorMessage = 'Return request not found.';
          } else {
            this.initializeRefundForm();
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error loading return details:', error);

          this.errorMessage =
            error?.error?.message ||
            'Unable to load return details. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  // Initialize refund form using existing API data
  private initializeRefundForm(): void {
    const item = this.returnItem;

    if (!item) {
      return;
    }

    this.refundMethod =
      item.refundMethod?.type ||
      item.refundMethod?.method ||
      item.refund?.refundMethod ||
      'original_payment_method';

    this.refundAmount = this.getAmount();

    this.refundReference =
      item.refundReference ||
      item.refund?.refundReference ||
      item.refund?.reference ||
      '';

    const processedAt =
      item.refundProcessedAt ||
      item.refund?.refundProcessedAt;

    this.refundProcessedAt = processedAt
      ? this.toDateTimeLocal(processedAt)
      : '';

    this.refundNotes =
      item.refund?.refundNotes ||
      item.refund?.notes ||
      '';

    this.cdr.markForCheck();
  }

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return '';
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);

    return localDate.toISOString().slice(0, 16);
  }

  // Refund amount
  getAmount(): number {
    const item = this.returnItem;

    if (!item) {
      return 0;
    }

    return (
      item.refundAmount ??
      item.requestedAmount ??
      item.refund?.amount ??
      item.order?.totalAmount ??
      item.order?.total ??
      0
    );
  }

  // Format status labels
  formatStatus(value?: string): string {
    if (!value) {
      return '—';
    }

    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // Status CSS classes
  statusClass(value?: string): string {
    const status = (value || '').toLowerCase();

    switch (status) {
      case 'requested':
      case 'refund_pending':
      case 'pending':
        return 'status-warning';

      case 'approved':
      case 'received':
      case 'inspection_pending':
      case 'approved_for_refund':
        return 'status-info';

      case 'refunded':
      case 'completed':
        return 'status-success';

      case 'rejected':
      case 'cancelled':
      case 'failed':
        return 'status-danger';

      default:
        return 'status-default';
    }
  }

  // Approve return
  approveReturn(): void {
    if (!this.returnId || this.updating) {
      return;
    }

    this.updateStatus('approved');
  }

  // Process refund
  processRefund(): void {
    if (!this.returnId || this.updating) {
      return;
    }

    this.errorMessage = '';

    if (!this.refundMethod) {
      this.errorMessage = 'Please select a refund method.';
      return;
    }

    if (!Number.isFinite(Number(this.refundAmount)) || this.refundAmount <= 0) {
      this.errorMessage = 'Please enter a valid refund amount.';
      return;
    }

    if (!this.refundReference.trim()) {
      this.errorMessage = 'Please enter the refund reference.';
      return;
    }

    if (!this.refundProcessedAt) {
      this.errorMessage = 'Please select the refund processed date.';
      return;
    }

    const processedDate = new Date(this.refundProcessedAt);

    if (isNaN(processedDate.getTime())) {
      this.errorMessage = 'Please enter a valid refund date.';
      return;
    }

    this.updateStatus('refunded');
  }

  // Complete return
  completeReturn(): void {
    if (!this.returnId || this.updating) {
      return;
    }

    this.updateStatus('completed');
  }

  // Build refund payload
  private getRefundPayload(): RefundPayload {
    return {
      refundMethod: this.refundMethod,
      refundReference: this.refundReference.trim(),
      refundAmount: Number(this.refundAmount),
      refundProcessedAt: new Date(
        this.refundProcessedAt
      ).toISOString(),
      refundNotes: this.refundNotes.trim(),
    };
  }

  // Update return status
  private updateStatus(
    status: 'approved' | 'refunded' | 'completed'
  ): void {
    const id = this.returnId;

    if (!id) {
      return;
    }

    this.updating = true;
    this.errorMessage = '';
    this.successMessage = '';

    let request$;

    switch (status) {
      case 'approved':
        request$ = this.api.approveAdminReturn(id);
        break;

      case 'refunded':
        request$ = this.api.markAdminReturnAsRefunded(
          id,
          this.getRefundPayload()
        );
        break;

      case 'completed':
        request$ = this.api.completeAdminReturn(
          id,
          this.getRefundPayload()
        );
        break;
    }

    request$
      .pipe(
        timeout(60000),
        finalize(() => {
          this.updating = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.errorMessage =
              response?.error?.message ||
              'Unable to update return status.';
            return;
          }

          this.successMessage =
            status === 'approved'
              ? 'Return approved successfully.'
              : status === 'refunded'
                ? 'Refund processed successfully.'
                : 'Return completed successfully.';

          this.loadReturnDetails(id);
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error updating return:', error);

          this.errorMessage =
            error?.error?.message ||
            'Unable to update return status. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  // Navigate back to returns list
  goBack(): void {
    this.router.navigate(['/returns-refunds']);
  }
}
