import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface ContactField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  placeholder: string;
  required: boolean;
}

interface ContactFormImage {
  field: string;
  url: string;
  key?: string;
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.html',
  styleUrl: './message.css',
})
export class Message implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  eyebrow = 'Contact form';
  title = 'SEND A MESSAGE';

  fields: ContactField[] = this.getDefaultFields();

  submitLabel = 'Send Message';
  submitAction = '/contact-inquiries';
  imageAlt = 'Woman weaving on a traditional handloom';

  formImageFile: File | null = null;
  formImagePreview: string | null = null;
  existingImageUrl = '';

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditMode = false;

  successMessage = '';
  errorMessage = '';

  private originalContent: any = null;

  ngOnInit(): void {
    this.loadContactForm();
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  private getDefaultFields(): ContactField[] {
    return [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        placeholder: 'Enter your full name',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'name@example.com',
        required: true,
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'tel',
        placeholder: '+91 00000 00000',
        required: true,
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'How can we help you?',
        required: true,
      },
    ];
  }

  private normalizeFieldType(type: string): ContactField['type'] {
    const allowed: ContactField['type'][] = [
      'text',
      'email',
      'tel',
      'textarea',
    ];

    return allowed.includes(type as ContactField['type'])
      ? (type as ContactField['type'])
      : 'text';
  }

  private parseContent(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }

    return value && typeof value === 'object' ? value : {};
  }

  private extractImageUrl(
    images: ContactFormImage[],
    content: any,
  ): string {
    // The API returns the actual URL in data.images[].
    const image = images.find(
      (item) => item.field === 'formImage',
    );

    if (image?.url) {
      return image.url;
    }

    // Fallbacks for responses that return the URL inside content.
    const values = [
      content?.formImageUrl,
      content?.formImage,
      content?.imageUrl,
      content?.image,
      content?.form_image,
    ];

    for (const value of values) {
      if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
        return value;
      }

      if (value && typeof value === 'object') {
        const url =
          value.url ?? value.secure_url ?? value.path;

        if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
          return url;
        }
      }
    }

    return '';
  }

  loadContactForm(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .getContactForm()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response: any) => {
          const root = response?.data ?? response;
          const content = this.parseContent(
            root?.content ?? root,
          );

          const images: ContactFormImage[] = Array.isArray(
            root?.images,
          )
            ? root.images
            : [];

          if (content && typeof content === 'object') {
            this.originalContent = {
              ...content,
              images,
            };

            this.eyebrow =
              content.eyebrow ?? 'Contact form';

            this.title =
              content.title ?? 'SEND A MESSAGE';

            this.fields = Array.isArray(content.fields)
              ? content.fields.map((field: any) => ({
                  name: field.name ?? '',
                  label: field.label ?? '',
                  type: this.normalizeFieldType(field.type),
                  placeholder: field.placeholder ?? '',
                  required: field.required ?? false,
                }))
              : this.getDefaultFields();

            this.submitLabel =
              content.submitLabel ?? 'Send Message';

            this.submitAction =
              content.submitAction ?? '/contact-inquiries';

            this.imageAlt =
              content.imageAlt ??
              'Woman weaving on a traditional handloom';

            this.existingImageUrl = this.extractImageUrl(
              images,
              content,
            );

            this.isEditMode = !!root?.id;
          } else {
            this.isEditMode = false;
            this.originalContent = null;
            this.existingImageUrl = '';
          }

          this.formImageFile = null;
          this.clearImagePreview();

          this.formImagePreview =
            this.existingImageUrl || null;

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          if (error?.status === 404) {
            this.isEditMode = false;
            this.originalContent = null;
            this.existingImageUrl = '';
            this.formImagePreview = null;

            this.errorMessage =
              'No Contact Form content was found. You can create it below.';
          } else {
            this.errorMessage =
              error?.error?.message ??
              'Unable to load Contact Form content.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  addField(): void {
    this.fields.push({
      name: '',
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
    });

    this.cdr.markForCheck();
  }

  removeField(index: number): void {
    if (index < 0 || index >= this.fields.length) {
      return;
    }

    this.fields.splice(index, 1);
    this.cdr.markForCheck();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must not exceed 5 MB.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.clearImagePreview();

    this.formImageFile = file;
    this.formImagePreview = URL.createObjectURL(file);

    this.cdr.markForCheck();
  }

  removeSelectedImage(): void {
    this.formImageFile = null;
    this.clearImagePreview();

    this.formImagePreview =
      this.existingImageUrl || null;

    this.cdr.markForCheck();
  }

  private clearImagePreview(): void {
    if (this.formImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.formImagePreview);
    }

    this.formImagePreview = null;
  }

  private validateForm(): boolean {
    if (!this.eyebrow.trim() || !this.title.trim()) {
      this.errorMessage =
        'Please enter the eyebrow and page title.';
      return false;
    }

    if (!this.submitLabel.trim() || !this.submitAction.trim()) {
      this.errorMessage =
        'Please enter the submit button label and action.';
      return false;
    }

    if (this.fields.length === 0) {
      this.errorMessage = 'Add at least one form field.';
      return false;
    }

    const names = new Set<string>();

    for (const field of this.fields) {
      if (
        !field.name.trim() ||
        !field.label.trim() ||
        !field.placeholder.trim()
      ) {
        this.errorMessage =
          'Every field needs a name, label, and placeholder.';
        return false;
      }

      const fieldName = field.name.trim();

      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(fieldName)) {
        this.errorMessage =
          `Invalid field name "${field.name}". Use letters, numbers, underscores, or hyphens, starting with a letter.`;
        return false;
      }

      if (names.has(fieldName)) {
        this.errorMessage =
          `The field name "${field.name}" is duplicated.`;
        return false;
      }

      names.add(fieldName);
    }

    return true;
  }

  saveContactForm(): void {
    if (this.isSaving || this.isDeleting) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateForm()) {
      return;
    }

    const content = {
      eyebrow: this.eyebrow.trim(),
      title: this.title.trim(),

      fields: this.fields.map((field) => ({
        name: field.name.trim(),
        label: field.label.trim(),
        type: field.type,
        placeholder: field.placeholder.trim(),
        required: field.required,
      })),

      submitLabel: this.submitLabel.trim(),
      submitAction: this.submitAction.trim(),
      imageField: 'formImage',
      imageAlt: this.imageAlt.trim(),
    };

    this.isSaving = true;

    const request = this.isEditMode
      ? this.api.updateContactForm(
          content,
          this.formImageFile ?? undefined,
        )
      : this.api.createContactForm(
          content,
          this.formImageFile ?? undefined,
        );

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.isEditMode = true;

          this.successMessage =
            response?.message ??
            'Contact Form saved successfully.';

          this.loadContactForm();
          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Unable to save Contact Form content.';

          this.cdr.markForCheck();
        },
      });
  }

  deleteContactForm(): void {
    if (
      !this.isEditMode ||
      this.isDeleting ||
      this.isSaving
    ) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete the Contact Form content? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteContactForm()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.originalContent = null;
          this.isEditMode = false;
          this.existingImageUrl = '';

          this.resetForm();

          this.successMessage =
            response?.message ??
            'Contact Form content deleted successfully.';

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Unable to delete Contact Form content.';

          this.cdr.markForCheck();
        },
      });
  }

  resetForm(): void {
    if (this.originalContent) {
      const content = this.originalContent;

      this.eyebrow =
        content.eyebrow ?? 'Contact form';

      this.title =
        content.title ?? 'SEND A MESSAGE';

      this.fields = Array.isArray(content.fields)
        ? content.fields.map((field: any) => ({
            name: field.name ?? '',
            label: field.label ?? '',
            type: this.normalizeFieldType(field.type),
            placeholder: field.placeholder ?? '',
            required: field.required ?? false,
          }))
        : this.getDefaultFields();

      this.submitLabel =
        content.submitLabel ?? 'Send Message';

      this.submitAction =
        content.submitAction ?? '/contact-inquiries';

      this.imageAlt =
        content.imageAlt ??
        'Woman weaving on a traditional handloom';

      this.existingImageUrl = this.extractImageUrl(
        content.images ?? [],
        content,
      );
    } else {
      this.eyebrow = 'Contact form';
      this.title = 'SEND A MESSAGE';
      this.fields = this.getDefaultFields();
      this.submitLabel = 'Send Message';
      this.submitAction = '/contact-inquiries';
      this.imageAlt =
        'Woman weaving on a traditional handloom';

      this.existingImageUrl = '';
    }

    this.formImageFile = null;

    this.clearImagePreview();

    this.formImagePreview =
      this.existingImageUrl || null;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();
  }
}
