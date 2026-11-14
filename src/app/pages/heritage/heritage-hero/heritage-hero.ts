
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-heritage-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './heritage-hero.html',
  styleUrl: './heritage-hero.css',
})
export class HeritageHero implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

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

  ngOnDestroy(): void {
    this.clearPreview();
  }

  loadHeritageHero(): void {
    this.isLoading = true;
    this.message = '';

    this.api
      .getHeritageHero()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          const content = data?.content ?? {};

          if (content && content.title) {
            this.title = content.title ?? '';
            this.imageAlt = content.imageAlt ?? '';

            const images = Array.isArray(data?.images)
              ? data.images
              : [];

            const heroImage = images.find(
              (image: any) => image.field === 'heroImage'
            );

            this.existingImageUrl = heroImage?.url ?? null;

            this.isEditing = true;
          } else {
            this.isEditing = false;
            this.existingImageUrl = null;
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Unable to load Heritage Hero content.',
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

    this.clearPreview();

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
      this.showMessage(
        'Please select a hero image before creating.',
        'error'
      );
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
      ? this.api.updateHeritageHero(
          content,
          this.selectedImage ?? undefined
        )
      : this.api.createHeritageHero(
          content,
          this.selectedImage ?? undefined
        );

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const wasEditing = this.isEditing;

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

    this.api
      .deleteHeritageHero()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.title = '';
          this.imageAlt = '';
          this.existingImageUrl = null;
          this.selectedImage = null;
          this.clearPreview();
          this.isEditing = false;

          this.showMessage(
            response?.message ??
              'Heritage Hero content deleted successfully.',
            'success'
          );
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to delete Heritage Hero content.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.selectedImage = null;
    this.clearPreview();
    this.message = '';

    if (this.isEditing) {
      this.loadHeritageHero();
    } else {
      this.title = '';
      this.imageAlt = '';
      this.existingImageUrl = null;
    }
  }

  removeSelectedImage(): void {
    this.selectedImage = null;
    this.clearPreview();
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
    this.cdr.markForCheck();
  }
}
