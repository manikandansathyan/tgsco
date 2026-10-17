
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

interface ContactInquiry {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt?: string;
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
    this.successMessage = '';

    this.api.getContactInquiries().subscribe({
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

        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage =
          error?.error?.message ?? 'Unable to load contact inquiries.';
        this.isLoading = false;
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

    this.api.createContactInquiry(inquiry).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Contact inquiry submitted successfully.';
        this.form = {
          name: '',
          email: '',
          phone: '',
          message: '',
        };

        this.loadInquiries();
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to submit contact inquiry.';
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
