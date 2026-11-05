
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support implements OnInit, OnDestroy {
  eyebrow = 'Schemes';
  title = 'Supporting the Weavers Who Sustain Our Heritage';
  description =
    'TGSCO works in close partnership with state and central government bodies to implement welfare schemes, financial support programmes, and skill development initiatives for handloom weavers across Telangana. This page serves as a central resource for weavers, cooperative members, and stakeholders to understand available support.';
  imageAlt = 'Hands working with handloom threads';

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
    this.loadSupportingWeavers();
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  loadSupportingWeavers(): void {
  this.isLoading = true;
  this.message = '';

  this.api
    .getSupportingWeavers()
    .pipe(
      timeout(60000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    )
    .subscribe({
      next: (response: any) => {
        const responseData = response?.data ?? response;
        const content = responseData?.content ?? responseData;

        if (!content || typeof content !== 'object') {
          this.isEditing = false;
          return;
        }

        // Load text content
        this.eyebrow = content.eyebrow ?? 'Schemes';

        this.title =
          content.title ??
          'Supporting the Weavers Who Sustain Our Heritage';

        this.description =
          content.description ??
          'TGSCO works in close partnership with state and central government bodies to implement welfare schemes, financial support programmes, and skill development initiatives for handloom weavers across Telangana. This page serves as a central resource for weavers, cooperative members, and stakeholders to understand available support.';

        this.imageAlt =
          content.imageAlt ?? 'Hands working with handloom threads';

        // Find the image from response.data.images[]
        const images = Array.isArray(responseData?.images)
          ? responseData.images
          : [];

        const supportingImage = images.find(
          (image: any) => image.field === 'supportingImage'
        );

        // Set existing image URL
        this.existingImage =
          supportingImage?.url ??
          this.extractImageUrl(content.supportingImage) ??
          this.extractImageUrl(content.imageUrl) ??
          this.extractImageUrl(content.image);

        // Check whether content already exists
        this.isEditing = !!(
          responseData?.id ||
          responseData?._id
        );

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Failed to load Supporting the Weavers:', error);

        this.showMessage(
          'Unable to load existing content. You can still create content if none exists.',
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

    this.clearImagePreview();
    this.imagePreview = URL.createObjectURL(file);
    this.message = '';
  }

  saveSupportingWeavers(): void {
    if (!this.eyebrow.trim()) {
      this.showMessage('Please enter the eyebrow text.', 'error');
      return;
    }

    if (!this.title.trim()) {
      this.showMessage('Please enter a title.', 'error');
      return;
    }

    if (!this.description.trim()) {
      this.showMessage('Please enter a description.', 'error');
      return;
    }

    if (!this.isEditing && !this.selectedImage) {
      this.showMessage('Please select a supporting image.', 'error');
      return;
    }

    const content = {
      eyebrow: this.eyebrow.trim(),
      title: this.title.trim(),
      description: this.description.trim(),
      imageField: 'supportingImage',
      imageAlt: this.imageAlt.trim(),
    };

    this.isSaving = true;
    this.message = '';

    const request = this.isEditing
      ? this.api.updateSupportingWeavers(
          content,
          this.selectedImage ?? undefined
        )
      : this.api.createSupportingWeavers(
          content,
          this.selectedImage ?? undefined
        );

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
              response?.message ?? 'Unable to save content.',
              'error'
            );
            return;
          }

          this.showMessage(
            this.isEditing
              ? 'Supporting the Weavers content updated successfully.'
              : 'Supporting the Weavers content created successfully.',
            'success'
          );

          this.isEditing = true;
          this.selectedImage = null;
          this.clearImagePreview();
          this.loadSupportingWeavers();
        },
        error: (error) => {
          console.error('Failed to save Supporting the Weavers:', error);
          this.showMessage(
            error?.error?.message ?? 'Failed to save content.',
            'error'
          );
        },
      });
  }

  deleteSupportingWeavers(): void {
    if (!this.isEditing) {
      this.showMessage('There is no content to delete.', 'error');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete the Supporting the Weavers content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.message = '';

    this.api
      .deleteSupportingWeavers()
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
              response?.message ?? 'Unable to delete content.',
              'error'
            );
            return;
          }

          this.eyebrow = 'Schemes';
          this.title = 'Supporting the Weavers Who Sustain Our Heritage';
          this.description =
            'TGSCO works in close partnership with state and central government bodies to implement welfare schemes, financial support programmes, and skill development initiatives for handloom weavers across Telangana. This page serves as a central resource for weavers, cooperative members, and stakeholders to understand available support.';
          this.imageAlt = 'Hands working with handloom threads';

          this.existingImage = null;
          this.selectedImage = null;
          this.isEditing = false;
          this.clearImagePreview();

          this.showMessage(
            'Supporting the Weavers content deleted successfully.',
            'success'
          );
        },
        error: (error) => {
          console.error('Failed to delete Supporting the Weavers:', error);
          this.showMessage(
            error?.error?.message ?? 'Failed to delete content.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.clearImagePreview();
    this.selectedImage = null;
    this.message = '';
    this.loadSupportingWeavers();
  }

  private extractImageUrl(value: any): string | null {
    if (typeof value === 'string') {
      return value || null;
    }

    if (value && typeof value === 'object') {
      return value.url ?? value.secure_url ?? value.src ?? null;
    }

    return null;
  }

  private clearImagePreview(): void {
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
      this.imagePreview = null;
    }
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
