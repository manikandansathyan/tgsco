
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails implements OnInit {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orderId = '';
  order: any = null;

  notes: any[] = [];
  refunds: any[] = [];

  loading = false;
  saving = false;
  notesLoading = false;

  errorMessage = '';
  successMessage = '';

  activeTab: 'overview' | 'shipment' | 'notes' | 'refunds' =
    'overview';

  statusOptions = [
    'pending_payment',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'returned',
    'cancelled',
    'refunded',
  ];

  shipmentStatusOptions = [
    'label_created',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'exception',
    'returned',
  ];

  statusForm = {
    status: '',
    message: '',
  };

  shipmentForm = {
    courier: '',
    trackingNumber: '',
    status: 'label_created',
    shippedAt: '',
    estimatedDeliveryAt: '',
  };

  noteMessage = '';

  cancelForm = {
    reason: '',
    refundAmount: null as number | null,
    refundStatus: 'requested',
    refundReference: '',
  };

  refundForm = {
    amount: null as number | null,
    reason: '',
    notes: '',
  };

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.orderId) {
      this.errorMessage = 'Order ID is missing.';
      return;
    }

    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api
      .getAdminOrderById(this.orderId)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.order = null;
            this.errorMessage =
              'Unable to load order details.';
            return;
          }

          const data = response?.data;

          if (
            !data ||
            typeof data !== 'object' ||
            Array.isArray(data) ||
            !data._id
          ) {
            this.order = null;
            this.errorMessage =
              'Order details were not found.';
            return;
          }

          this.order = data;

          this.statusForm.status =
            data.orderStatus ?? 'pending_payment';

          const shipment = data.shipment ?? {};

          this.shipmentForm = {
            courier: shipment.courier ?? '',
            trackingNumber: shipment.trackingNumber ?? '',
            status: shipment.status ?? 'label_created',
            shippedAt: this.toDateTimeLocal(
              shipment.shippedAt,
            ),
            estimatedDeliveryAt: this.toDateTimeLocal(
              shipment.estimatedDeliveryAt,
            ),
          };

          this.loadNotes();
          this.loadRefundsFromOrder();
        },
        error: (error: any) => {
          this.order = null;

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'Loading order details timed out. Please try again.'
              : error?.error?.error?.message ??
                error?.error?.message ??
                'Unable to load order details.';
        },
      });
  }

  updateStatus(): void {
    if (!this.statusForm.status) {
      this.errorMessage = 'Please select an order status.';
      return;
    }

    this.runAction(() =>
      this.api.updateAdminOrderStatus(this.orderId, {
        status: this.statusForm.status,
        message: this.statusForm.message.trim() || undefined,
      }),
    );
  }

  saveShipment(): void {
    if (!this.shipmentForm.courier.trim()) {
      this.errorMessage = 'Please enter the courier name.';
      return;
    }

    if (!this.shipmentForm.trackingNumber.trim()) {
      this.errorMessage = 'Please enter the tracking number.';
      return;
    }

    const payload = {
      courier: this.shipmentForm.courier.trim(),
      trackingNumber: this.shipmentForm.trackingNumber.trim(),
      status: this.shipmentForm.status,
      shippedAt: this.toIsoDate(this.shipmentForm.shippedAt),
      estimatedDeliveryAt: this.toIsoDate(
        this.shipmentForm.estimatedDeliveryAt,
      ),
    };

    const shipment = this.order?.shipment;

    this.runAction(() =>
      shipment
        ? this.api.updateAdminOrderShipment(
            this.orderId,
            payload,
          )
        : this.api.createAdminOrderShipment(
            this.orderId,
            payload,
          ),
    );
  }

  updateShipmentStatus(): void {
    if (!this.shipmentForm.status) {
      this.errorMessage = 'Please select a shipment status.';
      return;
    }

    this.runAction(() =>
      this.api.updateAdminOrderShipmentStatus(this.orderId, {
        status: this.shipmentForm.status,
      }),
    );
  }

  addNote(): void {
    const message = this.noteMessage.trim();

    if (!message) {
      this.errorMessage = 'Please enter a note.';
      return;
    }

    this.runAction(
      () =>
        this.api.addAdminOrderNote(this.orderId, {
          message,
        }),
      () => {
        this.noteMessage = '';
      },
    );
  }

  loadNotes(): void {
    const orderNotes = this.order?.notes;

    this.notes = Array.isArray(orderNotes)
      ? orderNotes
      : [];
  }

  refreshNotes(): void {
    this.notesLoading = true;

    this.api
      .getAdminOrderNotes(this.orderId)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.notesLoading = false;
        }),
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          const items = Array.isArray(data)
            ? data
            : data?.notes ??
              data?.items ??
              data?.results ??
              [];

          this.notes = Array.isArray(items) ? items : [];
        },
        error: () => {
          this.notesLoading = false;
          this.errorMessage = 'Unable to refresh order notes.';
        },
      });
  }

  cancelOrder(): void {
    const reason = this.cancelForm.reason.trim();

    if (!reason) {
      this.errorMessage =
        'Please enter a cancellation reason.';
      return;
    }

    if (!this.canCancel) {
      this.errorMessage =
        'This order cannot be cancelled.';
      return;
    }

    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    const payload: {
      reason: string;
      refund?: {
        amount: number;
        status?: string;
        reference?: string;
      };
    } = { reason };

    if (
      this.cancelForm.refundAmount !== null &&
      this.cancelForm.refundAmount > 0
    ) {
      payload.refund = {
        amount: this.cancelForm.refundAmount,
        status: this.cancelForm.refundStatus || 'requested',
        reference:
          this.cancelForm.refundReference.trim() || undefined,
      };
    }

    this.runAction(() =>
      this.api.cancelAdminOrder(this.orderId, payload),
    );
  }

  getInvoice(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .getAdminOrderInvoice(this.orderId)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.api.scrollToTop();
        }),
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          const invoiceUrl =
            data?.invoiceUrl ??
            data?.url ??
            data?.downloadUrl;

          if (invoiceUrl) {
            this.successMessage =
              'Invoice retrieved successfully.';
            window.open(invoiceUrl, '_blank', 'noopener');
          } else {
            this.successMessage =
              'Invoice response received, but no download URL was provided.';
          }
        },
        error: (error: any) => {
          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'Invoice request timed out. Please try again.'
              : error?.error?.error?.message ??
                error?.error?.message ??
                'Unable to retrieve invoice.';
        },
      });
  }

  createRefund(): void {
    if (
      this.refundForm.amount === null ||
      !Number.isFinite(Number(this.refundForm.amount)) ||
      this.refundForm.amount <= 0
    ) {
      this.errorMessage =
        'Enter a refund amount greater than zero.';
      return;
    }

    if (!this.refundForm.reason.trim()) {
      this.errorMessage = 'Please enter a refund reason.';
      return;
    }

    if (!confirm('Submit this refund request?')) {
      return;
    }

    const idempotencyKey = this.createIdempotencyKey();

    const notes: Record<string, unknown> | undefined =
      this.refundForm.notes.trim()
        ? { adminNote: this.refundForm.notes.trim() }
        : undefined;

    this.runAction(
      () =>
        this.api.createAdminOrderRefund(
          this.orderId,
          {
            amount: Number(this.refundForm.amount),
            reason: this.refundForm.reason.trim(),
            notes,
          },
          idempotencyKey,
        ),
      () => {
        this.refundForm = {
          amount: null,
          reason: '',
          notes: '',
        };
      },
    );
  }

  loadRefundsFromOrder(): void {
    const orderRefunds = this.order?.refunds;

    this.refunds = Array.isArray(orderRefunds)
      ? orderRefunds
      : [];
  }

  private runAction(
    request: () => any,
    afterSuccess?: () => void,
  ): void {
    if (this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    request()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.api.scrollToTop();
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.successMessage =
            response?.message ??
            response?.data?.message ??
            'Changes saved successfully.';

          afterSuccess?.();

          this.loadOrder();
        },
        error: (error: any) => {
          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The request timed out. Please try again.'
              : error?.error?.error?.message ??
                error?.error?.message ??
                'The operation failed. Please try again.';
        },
      });
  }

  private createIdempotencyKey(): string {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private toDateTimeLocal(
    value: string | Date | null | undefined,
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const local = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return local.toISOString().slice(0, 16);
  }

  private toIsoDate(
    value: string,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? undefined
      : date.toISOString();
  }

  get orderNumber(): string {
    return String(
      this.order?.orderNumber ??
        this.order?._id ??
        this.order?.id ??
        this.orderId,
    );
  }

  get customerName(): string {
    return (
      this.order?.shippingAddress?.recipientName ??
      this.order?.billingAddress?.recipientName ??
      this.order?.customerName ??
      '—'
    );
  }

  get customerEmail(): string {
    return (
      this.order?.customerEmail ??
      this.order?.email ??
      '—'
    );
  }

  get customerMobile(): string {
    return (
      this.order?.shippingAddress?.mobile ??
      this.order?.billingAddress?.mobile ??
      '—'
    );
  }

  get totalAmount(): number | null {
    const value = this.order?.grandTotal;

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const amount = Number(value);

    return Number.isFinite(amount) ? amount : null;
  }

  get currency(): string {
    return (
      this.order?.currency ??
      this.order?.items?.[0]?.currency ??
      'INR'
    );
  }

  get orderStatus(): string {
    return (
      this.order?.orderStatus ??
      'pending_payment'
    );
  }

  get paymentStatus(): string {
    return (
      this.order?.paymentStatus ??
      'pending'
    );
  }

  get paymentMethod(): string {
    return this.order?.paymentMethod ?? '—';
  }

  get returnStatus(): string {
    return this.order?.returnStatus ?? 'none';
  }

  get orderItems(): any[] {
    return Array.isArray(this.order?.items)
      ? this.order.items
      : [];
  }

  get canCancel(): boolean {
    return ![
      'cancelled',
      'delivered',
      'returned',
      'refunded',
    ].includes(this.orderStatus.toLowerCase());
  }

  formatStatus(
    status: string | null | undefined,
  ): string {
    if (!status) {
      return '—';
    }

    return status
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );
  }

  formatCurrency(
    amount: number | string | null | undefined,
    currency = this.currency,
  ): string {
    if (
      amount === null ||
      amount === undefined ||
      amount === ''
    ) {
      return '—';
    }

    const value = Number(amount);

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

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
