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

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  title = 'NEWS & EVENTS';
  imageAlt = 'TGSCO handloom exhibition and textiles';

  heroImage: File | null = null;
  imagePreview = '';
  existingImageUrl = '';

  loading = false;
  saving = false;
  deleting = false;
  isEditMode = false;

  message = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadNewsHero();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private parseContent(value: any): any {
    if (typeof value !== 'string') {
      return value ?? {};
    }

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  private extractData(response: any): any {
    const data = response?.data ?? response ?? {};
    const content = this.parseContent(data.content);

    return {
      ...data,
      ...content,
      images: data.images ?? [],
    };
  }

  private extractImageUrl(data: any): string {
    // Get the image URL from the API images array.
    const heroImageData = data?.images?.find(
      (image: any) => image.field === 'heroImage'
    );

    if (heroImageData?.url) {
      return heroImageData.url;
    }

    // Fallback for older API response formats.
    const image =
      data?.heroImage ??
      data?.imageUrl ??
      data?.imageURL ??
      data?.image_url ??
      data?.image;

    if (typeof image === 'string') {
      return image;
    }

    return (
      image?.url ??
      image?.imageUrl ??
      image?.secure_url ??
      image?.path ??
      ''
    );
  }

  loadNewsHero(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .getNewsHero()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = this.extractData(response);

          this.title = data.title ?? 'NEWS & EVENTS';

          this.imageAlt =
            data.imageAlt ??
            'TGSCO handloom exhibition and textiles';

          this.revokePreview();
          this.heroImage = null;

          // Read the image URL from data.images[].
          this.existingImageUrl = this.extractImageUrl(data);

          this.isEditMode = !!(
            data.id ||
            data.title ||
            this.existingImageUrl
          );
        },

        error: (error: any) => {
          if (error.status === 404) {
            this.isEditMode = false;
            this.existingImageUrl = '';
            this.message =
              'No hero content found. You can create it below.';
            return;
          }

          this.errorMessage =
            error?.error?.message ??
            'Failed to load News & Events hero.';
        },
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must be less than 5 MB.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.revokePreview();

    this.heroImage = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  saveNewsHero(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the hero title.';
      return;
    }

    if (!this.heroImage && !this.existingImageUrl) {
      this.errorMessage = 'Please upload a hero image.';
      return;
    }

    const content = {
      title: this.title.trim(),
      imageField: 'heroImage',
      imageAlt: this.imageAlt.trim() || this.title.trim(),
    };

    this.saving = true;

    const request = this.isEditMode
      ? this.api.updateNewsHero(content, this.heroImage)
      : this.api.createNewsHero(content, this.heroImage);

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.message =
            response?.message ??
            (this.isEditMode
              ? 'News & Events hero updated successfully.'
              : 'News & Events hero created successfully.');

          this.loadNewsHero();
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Failed to save News & Events hero.';
        },
      });
  }

  deleteNewsHero(): void {
    if (
      !confirm(
        'Are you sure you want to delete the News & Events hero?'
      )
    ) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .deleteNewsHero()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deleting = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.revokePreview();

          this.title = 'NEWS & EVENTS';
          this.imageAlt = 'TGSCO handloom exhibition and textiles';

          this.heroImage = null;
          this.existingImageUrl = '';
          this.isEditMode = false;

          this.message =
            'News & Events hero deleted successfully.';
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Failed to delete News & Events hero.';
        },
      });
  }

  resetForm(): void {
    this.loadNewsHero();
  }

  private revokePreview(): void {
    if (this.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imagePreview = '';
  }
}
