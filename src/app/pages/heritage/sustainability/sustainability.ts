import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-sustainability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sustainability.html',
  styleUrl: './sustainability.css',
})
export class Sustainability implements OnInit, OnDestroy {
  private api = inject(Api);

  title = 'Slow by Tradition, Sustainable by Design';
  description = '';
  closingTitle = 'Slow fashion, made with intention';
  imageAlt = 'Hands weaving fabric on a traditional loom';
  backgroundColor = '#000000';

  sustainabilityImage: File | null = null;
  imagePreview: string | null = null;
  existingImageUrl: string | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loadSustainability();
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  loadSustainability(): void {
    this.isLoading = true;
    this.message = '';

    this.api.getHeritageSustainability().subscribe({
      next: (response: any) => {
        const result = response?.data ?? response;
        const content = result?.content ?? result;

        if (
          content &&
          typeof content === 'object' &&
          content.title
        ) {
          this.title = content.title ?? '';
          this.description = content.description ?? '';
          this.closingTitle = content.closingTitle ?? '';
          this.imageAlt = content.imageAlt ?? '';
          this.backgroundColor = content.backgroundColor ?? '#000000';

          this.existingImageUrl = this.extractImageUrl(content, result);
          this.isEditing = true;
        } else {
          this.isEditing = false;
        }

        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;

        this.showMessage(
          error?.error?.message ??
            'Unable to load sustainability content.',
          'error'
        );
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Image size must be 5 MB or less.', 'error');
      input.value = '';
      return;
    }

    this.clearImagePreview();
    this.sustainabilityImage = file;
    this.imagePreview = URL.createObjectURL(file);
    this.message = '';
  }

  removeSelectedImage(): void {
    this.sustainabilityImage = null;
    this.clearImagePreview();
  }

  saveSustainability(): void {
    if (!this.title.trim()) {
      this.showMessage('Please enter the section title.', 'error');
      return;
    }

    if (!this.description.trim()) {
      this.showMessage('Please enter the description.', 'error');
      return;
    }

    if (!this.closingTitle.trim()) {
      this.showMessage('Please enter the closing title.', 'error');
      return;
    }

    if (!this.imageAlt.trim()) {
      this.showMessage('Please enter the image alt text.', 'error');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(this.backgroundColor)) {
      this.showMessage(
        'Enter a valid six-digit hexadecimal background color.',
        'error'
      );
      return;
    }

    if (!this.isEditing && !this.sustainabilityImage) {
      this.showMessage(
        'Please upload the sustainability image before creating the content.',
        'error'
      );
      return;
    }

    const content = {
      title: this.title.trim(),
      description: this.description.trim(),
      closingTitle: this.closingTitle.trim(),
      imageField: 'sustainabilityImage',
      imageAlt: this.imageAlt.trim(),
      backgroundColor: this.backgroundColor,
    };

    this.isSaving = true;
    this.message = '';

    const wasEditing = this.isEditing;

    const request = wasEditing
      ? this.api.updateHeritageSustainability(
          content,
          this.sustainabilityImage ?? undefined
        )
      : this.api.createHeritageSustainability(
          content,
          this.sustainabilityImage ?? undefined
        );

    request.subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.isEditing = true;
        this.sustainabilityImage = null;
        this.clearImagePreview();

        this.showMessage(
          response?.message ??
            (wasEditing
              ? 'Sustainability content updated successfully.'
              : 'Sustainability content created successfully.'),
          'success'
        );

        this.loadSustainability();
      },
      error: (error: any) => {
        this.isSaving = false;

        this.showMessage(
          error?.error?.message ??
            'Failed to save sustainability content.',
          'error'
        );
      },
    });
  }

  deleteSustainability(): void {
    if (
      !window.confirm(
        'Are you sure you want to delete the sustainability content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.message = '';

    this.api.deleteHeritageSustainability().subscribe({
      next: (response: any) => {
        this.isDeleting = false;

        this.title = '';
        this.description = '';
        this.closingTitle = '';
        this.imageAlt = '';
        this.backgroundColor = '#000000';

        this.sustainabilityImage = null;
        this.existingImageUrl = null;
        this.clearImagePreview();
        this.isEditing = false;

        this.showMessage(
          response?.message ??
            'Sustainability content deleted successfully.',
          'success'
        );
      },
      error: (error: any) => {
        this.isDeleting = false;

        this.showMessage(
          error?.error?.message ??
            'Failed to delete sustainability content.',
          'error'
        );
      },
    });
  }

  resetForm(): void {
    this.sustainabilityImage = null;
    this.clearImagePreview();
    this.message = '';

    if (this.isEditing) {
      this.loadSustainability();
      return;
    }

    this.title = 'Slow by Tradition, Sustainable by Design';
    this.description = '';
    this.closingTitle = 'Slow fashion, made with intention';
    this.imageAlt = 'Hands weaving fabric on a traditional loom';
    this.backgroundColor = '#000000';
    this.existingImageUrl = null;
  }

  private extractImageUrl(content: any, result: any): string | null {
    const image = content?.sustainabilityImage;

    return (
      content?.sustainabilityImageUrl ??
      content?.imageUrl ??
      content?.image ??
      (typeof image === 'string' ? image : image?.url) ??
      result?.sustainabilityImageUrl ??
      result?.imageUrl ??
      null
    );
  }

  private clearImagePreview(): void {
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imagePreview = null;
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message = message;
    this.messageType = type;
  }
}
