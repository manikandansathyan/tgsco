
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

interface SustainabilityImage {
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

  ngOnInit(): void {
    this.initializeImages();
    this.loadSustainability();
  }

  ngOnDestroy(): void {
    this.clearAllPreviews();
  }

  private initializeImages(): void {
    this.images = Array.from({ length: 6 }, (_, index) => ({
      alt:
        index === 0
          ? 'Hands weaving fabric on a traditional loom'
          : '',
      file: null,
      previewUrl: null,
      existingUrl: null,
    }));
  }

  loadSustainability(): void {
    this.isLoading = true;
    this.message = '';

    this.api.getHeritageSustainability().subscribe({
      next: (response: any) => {
        const result = response?.data ?? response;
        let content = result?.content ?? result;

        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch {
            content = {};
          }
        }

        if (content && typeof content === 'object' && content.title) {
          this.title = content.title ?? '';
          this.description = content.description ?? '';
          this.closingTitle = content.closingTitle ?? '';
          this.backgroundColor = content.backgroundColor ?? '#000000';

          this.initializeImages();

          const apiImages = Array.isArray(content.images)
            ? content.images
            : [];

          apiImages.slice(0, 6).forEach((image: any, index: number) => {
            this.images[index].alt =
              image?.alt ??
              image?.imageAlt ??
              (index === 0
                ? 'Hands weaving fabric on a traditional loom'
                : '');

            this.images[index].existingUrl =
              this.extractImageUrl(image);
          });

          if (apiImages.length === 0) {
            const legacyImageUrl = this.extractLegacyImageUrl(
              content,
              result
            );

            if (legacyImageUrl) {
              this.images[0].existingUrl = legacyImageUrl;
            }

            this.images[0].alt =
              content.imageAlt ??
              this.images[0].alt;
          }

          this.isEditing = true;
        } else {
          this.isEditing = false;
          this.initializeImages();
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

    const content = {
      title: this.title.trim(),
      description: this.description.trim(),
      closingTitle: this.closingTitle.trim(),
      backgroundColor: this.backgroundColor,
      imageField: 'sustainabilityImage',
      imageAlt: this.images[0].alt.trim(),
      images: this.images
        .map((image, index) => ({
          field: `sustainabilityImage${index + 1}`,
          alt: image.alt.trim(),
          index,
        }))
        .filter(
          (image) =>
            this.images[image.index].file ||
            this.images[image.index].existingUrl
        ),
    };

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

    request.subscribe({
      next: (response: any) => {
        this.isSaving = false;

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

  private extractImageUrl(image: any): string | null {
    if (typeof image === 'string') return image;

    return (
      image?.imageUrl ??
      image?.url ??
      image?.image ??
      image?.path ??
      null
    );
  }

  private extractLegacyImageUrl(
    content: any,
    result: any
  ): string | null {
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
