import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface ContactInquiry {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
}

@Component({
  selector: 'app-contact-inquiries',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-inquiries.html',
  styleUrl: './contact-inquiries.css',
})
export class ContactInquiries implements OnInit {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  inquiries: ContactInquiry[] = [];

  isLoading = false;
  isSubmitting = false;

  successMessage = '';
  errorMessage = '';

  form = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  ngOnInit(): void {
    this.loadInquiries();
  }

  loadInquiries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getContactInquiries()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          if (Array.isArray(data)) {
            this.inquiries = data;
          } else if (Array.isArray(data?.inquiries)) {
            this.inquiries = data.inquiries;
          } else if (Array.isArray(data?.items)) {
            this.inquiries = data.items;
          } else {
            this.inquiries = [];
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ?? 'Unable to load contact inquiries.';

          this.cdr.markForCheck();
        },
      });
  }

  submitInquiry(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const inquiry = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      message: this.form.message.trim(),
    };

    if (
      !inquiry.name ||
      !inquiry.email ||
      !inquiry.phone ||
      !inquiry.message
    ) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isSubmitting = true;

    this.api
      .createContactInquiry(inquiry)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSubmitting = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Contact inquiry submitted successfully.';

          this.form = {
            name: '',
            email: '',
            phone: '',
            message: '',
          };

          this.loadInquiries();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ?? 'Failed to submit contact inquiry.';

          this.cdr.markForCheck();
        },
      });
  }

  getInquiryDate(inquiry: ContactInquiry): string {
    const date = inquiry.createdAt ?? inquiry.created_at;

    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? '—'
      : parsedDate.toLocaleString();
  }

  getInquiryId(inquiry: ContactInquiry): string {
    return inquiry._id ?? inquiry.id ?? '—';
  }

  trackInquiry(index: number, inquiry: ContactInquiry): string | number {
    return this.getInquiryId(inquiry) === '—'
      ? index
      : this.getInquiryId(inquiry);
  }
}
