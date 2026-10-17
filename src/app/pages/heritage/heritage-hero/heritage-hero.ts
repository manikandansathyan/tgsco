import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-heritage-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './heritage-hero.html',
  styleUrl: './heritage-hero.css',
})
export class HeritageHero implements OnInit {
  private api = inject(Api);

  title = 'The Handloom Ecosystem';
  imageAlt = 'Handloom weaving with a traditional shuttle';

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  existingImageUrl: string | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loadHeritageHero();
  }

  loadHeritageHero(): void {
    this.isLoading = true;
    this.message = '';

    this.api.getHeritageHero().subscribe({
      next: (response: any) => {
        const result = response?.data ?? response;
        const content = result?.content ?? result;

        if (content && typeof content === 'object' && content.title) {
          this.title = content.title ?? '';
          this.imageAlt = content.imageAlt ?? '';
          this.existingImageUrl =
            content.heroImageUrl ??
            content.imageUrl ??
            content.heroImage ??
            result?.heroImageUrl ??
            result?.imageUrl ??
            null;

          this.isEditing = true;
        } else {
          this.isEditing = false;
        }

        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showMessage(
          error?.error?.message ?? 'Unable to load Heritage Hero content.',
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

    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.selectedImage = file;
    this.imagePreview = URL.createObjectURL(file);
    this.message = '';
  }

  saveHeritageHero(): void {
    if (!this.title.trim()) {
      this.showMessage('Please enter a title.', 'error');
      return;
    }

    if (!this.imageAlt.trim()) {
      this.showMessage('Please enter image alt text.', 'error');
      return;
    }

    if (!this.isEditing && !this.selectedImage) {
      this.showMessage('Please select a hero image before creating.', 'error');
      return;
    }

    const content = {
      title: this.title.trim(),
      imageField: 'heroImage',
      imageAlt: this.imageAlt.trim(),
    };

    this.isSaving = true;
    this.message = '';

    const request = this.isEditing
      ? this.api.updateHeritageHero(content, this.selectedImage ?? undefined)
      : this.api.createHeritageHero(content, this.selectedImage ?? undefined);

    request.subscribe({
      next: (response: any) => {
        const wasEditing = this.isEditing;

        this.isSaving = false;
        this.isEditing = true;
        this.selectedImage = null;
        this.clearPreview();

        this.showMessage(
          response?.message ??
          (wasEditing
            ? 'Heritage Hero updated successfully.'
            : 'Heritage Hero created successfully.'),
          'success'
        );

        this.loadHeritageHero();
      },
      error: (error: any) => {
        this.isSaving = false;
        this.showMessage(
          error?.error?.message ?? 'Failed to save Heritage Hero content.',
          'error'
        );
      },
    });
  }

  deleteHeritageHero(): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete the Heritage Hero content?'
    );

    if (!confirmed) return;

    this.isDeleting = true;
    this.message = '';

    this.api.deleteHeritageHero().subscribe({
      next: (response: any) => {
        this.isDeleting = false;
        this.title = '';
        this.imageAlt = '';
        this.existingImageUrl = null;
        this.selectedImage = null;
        this.clearPreview();
        this.isEditing = false;

        this.showMessage(
          response?.message ?? 'Heritage Hero content deleted successfully.',
          'success'
        );
      },
      error: (error: any) => {
        this.isDeleting = false;
        this.showMessage(
          error?.error?.message ?? 'Failed to delete Heritage Hero content.',
          'error'
        );
      },
    });
  }

  resetForm(): void {
    this.title = '';
    this.imageAlt = '';
    this.selectedImage = null;
    this.clearPreview();
    this.message = '';

    if (this.isEditing) {
      this.loadHeritageHero();
    } else {
      this.existingImageUrl = null;
    }
  }

  private clearPreview(): void {
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

  removeSelectedImage(): void {
    this.selectedImage = null;
    this.clearPreview();
  }
}
