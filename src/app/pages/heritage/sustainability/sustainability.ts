
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

interface SustainabilityImage {
  title: string;
  alt: string;
  file: File | null;
  previewUrl: string | null;
  existingUrl: string | null;
}

@Component({
  selector: 'app-sustainability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sustainability.html',
  styleUrl: './sustainability.css',
})
export class Sustainability implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  title = 'Slow by Tradition, Sustainable by Design';
  description = '';
  closingTitle = 'Slow fashion, made with intention';
  backgroundColor = '#000000';

  images: SustainabilityImage[] = [];

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  private readonly defaultImages = [
    {
      title: 'Slow fashion, made with intention',
      alt: 'Hands weaving fabric on a traditional loom',
    },
    {
      title: 'Crafted with care',
      alt: 'Close-up of handloom weaving',
    },
    {
      title: 'Natural fibres, lasting beauty',
      alt: 'Natural fibres prepared for handloom weaving',
    },
    {
      title: 'Heritage in every thread',
      alt: 'Traditional handloom textile',
    },
    {
      title: 'Made by hand, made to last',
      alt: 'Artisan working at a handloom',
    },
    {
      title: 'A sustainable tradition',
      alt: 'Telangana handloom artisan weaving',
    },
  ];

  ngOnInit(): void {
    this.initializeImages();
    this.loadSustainability();
  }

  ngOnDestroy(): void {
    this.clearAllPreviews();
  }

  private initializeImages(): void {
    this.images = this.defaultImages.map((item) => ({
      title: item.title,
      alt: item.alt,
      file: null,
      previewUrl: null,
      existingUrl: null,
    }));
  }

  loadSustainability(): void {
    this.isLoading = true;
    this.message = '';

    this.api
      .getHeritageSustainability()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = response?.data ?? response;
          const content = result?.content ?? {};

          if (
            content &&
            typeof content === 'object' &&
            content.title
          ) {
            this.title = content.title ?? '';
            this.description = content.description ?? '';
            this.closingTitle = content.closingTitle ?? '';
            this.backgroundColor =
              content.backgroundColor ?? '#000000';

            this.clearAllPreviews();
            this.initializeImages();

            // Metadata is stored inside data.content.images.
            const imageMetadata = Array.isArray(content.images)
              ? content.images
              : [];

            // Actual image URLs are stored separately in data.images.
            const uploadedImages = Array.isArray(result?.images)
              ? result.images
              : [];

            this.images.forEach((image, index) => {
              const field = `images[${index}].image`;

              const metadata = imageMetadata.find(
                (item: any) => item?.field === field
              );

              const uploadedImage = uploadedImages.find(
                (item: any) => item?.field === field
              );

              if (metadata) {
                image.title = metadata.title ?? image.title;
                image.alt = metadata.alt ?? '';
              }

              image.existingUrl = uploadedImage?.url ?? null;
            });

            this.isEditing = true;
          } else {
            this.clearAllPreviews();
            this.initializeImages();
            this.isEditing = false;
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Unable to load sustainability content.',
            'error'
          );
        },
      });
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Each image must be 5 MB or less.', 'error');
      input.value = '';
      return;
    }

    const image = this.images[index];

    this.clearPreview(image);

    image.file = file;
    image.previewUrl = URL.createObjectURL(file);

    this.message = '';
  }

  removeSelectedImage(index: number): void {
    const image = this.images[index];

    image.file = null;
    this.clearPreview(image);
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

    if (!/^#[0-9A-Fa-f]{6}$/.test(this.backgroundColor)) {
      this.showMessage(
        'Enter a valid six-digit hexadecimal background color.',
        'error'
      );
      return;
    }

    const hasAnyImage = this.images.some(
      (image) => image.file || image.existingUrl
    );

    if (!hasAnyImage) {
      this.showMessage(
        'Please upload at least one sustainability image.',
        'error'
      );
      return;
    }

    for (let index = 0; index < this.images.length; index++) {
      const image = this.images[index];

      if (
        (image.file || image.existingUrl) &&
        !image.alt.trim()
      ) {
        this.showMessage(
          `Please enter alt text for image ${index + 1}.`,
          'error'
        );
        return;
      }
    }

    // Match the image metadata structure returned by the API.
    const content = {
      title: this.title.trim(),
      description: this.description.trim(),
      closingTitle: this.closingTitle.trim(),
      backgroundColor: this.backgroundColor,

      images: this.images
        .map((image, index) => ({
          title: image.title.trim(),
          field: `images[${index}].image`,
          alt: image.alt.trim(),
          index,
        }))
        .filter(
          (image) =>
            this.images[image.index].file ||
            this.images[image.index].existingUrl
        )
        .map(({ title, field, alt }) => ({
          title,
          field,
          alt,
        })),
    };

    // Files are indexed so the API service can use the exact field names.
    const uploadedImages: Record<number, File> = {};

    this.images.forEach((image, index) => {
      if (image.file) {
        uploadedImages[index] = image.file;
      }
    });

    this.isSaving = true;
    this.message = '';

    const wasEditing = this.isEditing;

    const request = wasEditing
      ? this.api.updateHeritageSustainability(
          content,
          uploadedImages
        )
      : this.api.createHeritageSustainability(
          content,
          uploadedImages
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
          this.clearAllPreviews();

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

    this.api
      .deleteHeritageSustainability()
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
          this.clearAllPreviews();

          this.title = 'Slow by Tradition, Sustainable by Design';
          this.description = '';
          this.closingTitle = 'Slow fashion, made with intention';
          this.backgroundColor = '#000000';

          this.initializeImages();
          this.isEditing = false;

          this.showMessage(
            response?.message ??
              'Sustainability content deleted successfully.',
            'success'
          );
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to delete sustainability content.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.clearAllPreviews();
    this.message = '';

    if (this.isEditing) {
      this.loadSustainability();
      return;
    }

    this.title = 'Slow by Tradition, Sustainable by Design';
    this.description = '';
    this.closingTitle = 'Slow fashion, made with intention';
    this.backgroundColor = '#000000';

    this.initializeImages();
  }

  private clearPreview(image: SustainabilityImage): void {
    if (image.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }

    image.previewUrl = null;
  }

  private clearAllPreviews(): void {
    this.images.forEach((image) => this.clearPreview(image));
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message = message;
    this.messageType = type;
  }
}
