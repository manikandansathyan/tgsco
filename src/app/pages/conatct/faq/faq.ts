
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

interface FaqItem {
  id: string;
  slug: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class Faq implements OnInit {
  private api = inject(Api);

  title = 'Frequently Asked Questions';
  items: FaqItem[] = [];

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  exists = false;

  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadFaq();
  }

  loadFaq(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.getFaq().subscribe({
      next: (response: any) => {
        const data = response?.data ?? response;

        this.title = data?.title ?? 'Frequently Asked Questions';
        this.items = Array.isArray(data?.items)
          ? data.items.map((item: any, index: number) => ({
              id: item.id ?? `faq-${index + 1}`,
              slug: item.slug ?? this.slugify(item.question ?? ''),
              question: item.question ?? '',
              answer: item.answer ?? '',
            }))
          : [];

        this.exists = !!data && (
          typeof data.title === 'string' ||
          Array.isArray(data.items)
        );

        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage =
          error?.error?.message ?? 'Unable to load FAQ content.';
        this.isLoading = false;
      },
    });
  }

  addItem(): void {
    const nextNumber = this.items.length + 1;

    this.items.push({
      id: `faq-${Date.now()}`,
      slug: `faq-${nextNumber}`,
      question: '',
      answer: '',
    });
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  updateSlug(item: FaqItem): void {
    item.slug = this.slugify(item.question);
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  saveFaq(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter an FAQ title.';
      return;
    }

    if (this.items.some(item => !item.question.trim())) {
      this.errorMessage = 'Every FAQ item must have a question.';
      return;
    }

    const content = {
      title: this.title.trim(),
      items: this.items.map(item => ({
        id: item.id || this.slugify(item.question),
        slug: this.slugify(item.question),
        question: item.question.trim(),
        answer: item.answer.trim(),
      })),
    };

    this.isSaving = true;

    const request = this.exists
      ? this.api.updateFaq(content)
      : this.api.createFaq(content);

    request.subscribe({
      next: () => {
        this.exists = true;
        this.isSaving = false;
        this.successMessage = 'FAQ content saved successfully.';
      },
      error: (error: any) => {
        this.isSaving = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to save FAQ content.';
      },
    });
  }

  deleteFaq(): void {
    if (!this.exists) {
      this.errorMessage = 'There is no saved FAQ content to delete.';
      return;
    }

    if (!confirm('Are you sure you want to delete all FAQ content?')) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.deleteFaq().subscribe({
      next: () => {
        this.title = 'Frequently Asked Questions';
        this.items = [];
        this.exists = false;
        this.isDeleting = false;
        this.successMessage = 'FAQ content deleted successfully.';
      },
      error: (error: any) => {
        this.isDeleting = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to delete FAQ content.';
      },
    });
  }
}
