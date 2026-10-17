
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-schemes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schemes.html',
  styleUrl: './schemes.css',
})
export class Schemes implements OnInit {
  title = 'Schemes';
  imageAlt = 'Hands working on a traditional handloom textile';

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  existingImage: string | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSchemesHero();
  }

  loadSchemesHero(): void {
    this.isLoading = true;
    this.message = '';

    this.api
      .getSchemesHero()
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

          if (data && !data.error && typeof data === 'object') {
            const content = data.content ?? data;

            this.title = content.title ?? 'Schemes';
            this.imageAlt =
              content.imageAlt ??
              'Hands working on a traditional handloom textile';

            this.existingImage =
              content.heroImage?.url ??
              content.heroImage ??
              content.imageUrl ??
              content.image ??
              null;

            this.isEditing = !!(
              content.title ||
              this.existingImage
            );
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load Schemes Hero:', error);
          this.showMessage(
            'Unable to load Schemes Hero content. You can still create it.',
            'error'
          );
        },
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

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

    this.selectedImage = file;

    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imagePreview = URL.createObjectURL(file);
    this.message = '';
  }

  saveSchemesHero(): void {
    if (!this.title.trim()) {
      this.showMessage('Please enter a title.', 'error');
      return;
    }

    if (!this.isEditing && !this.selectedImage) {
      this.showMessage('Please select a hero image.', 'error');
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
      ? this.api.updateSchemesHero(content, this.selectedImage ?? undefined)
      : this.api.createSchemesHero(content, this.selectedImage ?? undefined);

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false || response?.error) {
            this.showMessage(
              response?.message ?? 'Unable to save Schemes Hero.',
              'error'
            );
            return;
          }

          this.showMessage(
            this.isEditing
              ? 'Schemes Hero updated successfully.'
              : 'Schemes Hero created successfully.',
            'success'
          );

          this.isEditing = true;
          this.selectedImage = null;

          if (this.imagePreview) {
            URL.revokeObjectURL(this.imagePreview);
            this.imagePreview = null;
          }

          this.loadSchemesHero();
        },
        error: (error) => {
          console.error('Failed to save Schemes Hero:', error);
          this.showMessage(
            error?.error?.message ?? 'Failed to save Schemes Hero.',
            'error'
          );
        },
      });
  }

  deleteSchemesHero(): void {
    if (!this.isEditing) {
      this.showMessage('There is no Schemes Hero content to delete.', 'error');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete the Schemes Hero content?'
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.message = '';

    this.api
      .deleteSchemesAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false || response?.error) {
            this.showMessage(
              response?.message ?? 'Unable to delete Schemes Hero.',
              'error'
            );
            return;
          }

          this.title = 'Schemes';
          this.imageAlt =
            'Hands working on a traditional handloom textile';
          this.existingImage = null;
          this.selectedImage = null;
          this.isEditing = false;

          if (this.imagePreview) {
            URL.revokeObjectURL(this.imagePreview);
            this.imagePreview = null;
          }

          this.showMessage(
            'Schemes Hero deleted successfully.',
            'success'
          );
        },
        error: (error) => {
          console.error('Failed to delete Schemes Hero:', error);
          this.showMessage(
            error?.error?.message ?? 'Failed to delete Schemes Hero.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.title = 'Schemes';
    this.imageAlt = 'Hands working on a traditional handloom textile';
    this.selectedImage = null;

    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
      this.imagePreview = null;
    }

    this.message = '';
    this.loadSchemesHero();
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
