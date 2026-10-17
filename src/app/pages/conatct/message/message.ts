
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

interface ContactField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  placeholder: string;
  required: boolean;
}

@Component({
  selector: 'app-message',
  imports: [CommonModule, FormsModule],
  templateUrl: './message.html',
  styleUrl: './message.css',
})
export class Message implements OnInit, OnDestroy {
  eyebrow = 'Contact form';
  title = 'SEND A MESSAGE';

  fields: ContactField[] = [
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

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.loadContactForm();
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  loadContactForm(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.getContactForm().subscribe({
      next: (response: any) => {
        const root = response?.data ?? response;
        const content = root?.content ?? root;

        if (content && typeof content === 'object') {
          this.originalContent = content;
          this.eyebrow = content.eyebrow ?? 'Contact form';
          this.title = content.title ?? 'SEND A MESSAGE';
          this.fields = Array.isArray(content.fields)
            ? content.fields.map((field: any) => ({
                name: field.name ?? '',
                label: field.label ?? '',
                type: this.normalizeFieldType(field.type),
                placeholder: field.placeholder ?? '',
                required: field.required ?? false,
              }))
            : this.getDefaultFields();

          this.submitLabel = content.submitLabel ?? 'Send Message';
          this.submitAction =
            content.submitAction ?? '/contact-inquiries';
          this.imageAlt =
            content.imageAlt ??
            'Woman weaving on a traditional handloom';

          this.existingImageUrl = this.extractImageUrl(
            root,
            content
          );
          this.isEditMode = true;
        } else {
          this.isEditMode = false;
        }

        this.formImageFile = null;
        this.clearImagePreview();
        this.formImagePreview = this.existingImageUrl || null;
        this.isLoading = false;
      },
      error: (error: any) => {
        if (error.status === 404) {
          this.isEditMode = false;
          this.errorMessage =
            'No Contact Form content was found. You can create it below.';
        } else {
          this.errorMessage =
            error?.error?.message ??
            'Unable to load Contact Form content.';
        }

        this.isLoading = false;
      },
    });
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

  private extractImageUrl(...sources: any[]): string {
    const keys = [
      'formImageUrl',
      'formImage',
      'imageUrl',
      'image',
      'form_image',
    ];

    for (const source of sources) {
      if (!source || typeof source !== 'object') {
        continue;
      }

      for (const key of keys) {
        const value = source[key];

        if (typeof value === 'string' && value.trim()) {
          return value;
        }

        if (value && typeof value === 'object') {
          const nested =
            value.url ?? value.secure_url ?? value.path;

          if (typeof nested === 'string' && nested.trim()) {
            return nested;
          }
        }
      }
    }

    return '';
  }

  addField(): void {
    this.fields.push({
      name: '',
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
    });
  }

  removeField(index: number): void {
    this.fields.splice(index, 1);
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
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.formImageFile = file;
    this.clearImagePreview();

    const reader = new FileReader();

    reader.onload = () => {
      this.formImagePreview = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.formImageFile = null;
    this.clearImagePreview();
    this.formImagePreview = this.existingImageUrl || null;
  }

  private clearImagePreview(): void {
    if (this.formImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.formImagePreview);
    }

    this.formImagePreview = null;
  }

  private validateForm(): boolean {
    if (!this.eyebrow.trim() || !this.title.trim()) {
      this.errorMessage = 'Please enter the eyebrow and page title.';
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

      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(field.name.trim())) {
        this.errorMessage =
          `Invalid field name "${field.name}". Use letters, numbers, underscores, or hyphens, starting with a letter.`;
        return false;
      }

      if (names.has(field.name.trim())) {
        this.errorMessage =
          `The field name "${field.name}" is duplicated.`;
        return false;
      }

      names.add(field.name.trim());
    }

    return true;
  }

  saveContactForm(): void {
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
      ? this.api.updateContactForm(content, this.formImageFile ?? undefined)
      : this.api.createContactForm(content, this.formImageFile ?? undefined);

    request.subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.isEditMode = true;
        this.successMessage =
          response?.message ?? 'Contact Form saved successfully.';
        this.loadContactForm();
      },
      error: (error: any) => {
        this.isSaving = false;
        this.errorMessage =
          error?.error?.message ??
          'Unable to save Contact Form content.';
      },
    });
  }

  deleteContactForm(): void {
    if (!this.isEditMode || this.isDeleting || this.isSaving) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete the Contact Form content? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.deleteContactForm().subscribe({
      next: (response: any) => {
        this.isDeleting = false;
        this.isEditMode = false;
        this.originalContent = null;
        this.resetForm();
        this.successMessage =
          response?.message ?? 'Contact Form content deleted.';
      },
      error: (error: any) => {
        this.isDeleting = false;
        this.errorMessage =
          error?.error?.message ??
          'Unable to delete Contact Form content.';
      },
    });
  }

  resetForm(): void {
    if (this.originalContent) {
      const content = this.originalContent;

      this.eyebrow = content.eyebrow ?? 'Contact form';
      this.title = content.title ?? 'SEND A MESSAGE';
      this.fields = Array.isArray(content.fields)
        ? content.fields.map((field: any) => ({
            name: field.name ?? '',
            label: field.label ?? '',
            type: this.normalizeFieldType(field.type),
            placeholder: field.placeholder ?? '',
            required: field.required ?? false,
          }))
        : this.getDefaultFields();

      this.submitLabel = content.submitLabel ?? 'Send Message';
      this.submitAction =
        content.submitAction ?? '/contact-inquiries';
      this.imageAlt = content.imageAlt ?? '';
    } else {
      this.eyebrow = 'Contact form';
      this.title = 'SEND A MESSAGE';
      this.fields = this.getDefaultFields();
      this.submitLabel = 'Send Message';
      this.submitAction = '/contact-inquiries';
      this.imageAlt = 'Woman weaving on a traditional handloom';
    }

    this.formImageFile = null;
    this.clearImagePreview();
    this.formImagePreview = this.existingImageUrl || null;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
