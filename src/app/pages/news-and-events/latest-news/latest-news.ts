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

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  imageAlt: string;
  imageFile: File | null;
  imagePreview: string;
  existingImageUrl: string;
}

@Component({
  selector: 'app-latest-news',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './latest-news.html',
  styleUrl: './latest-news.css',
})
export class LatestNews implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  sectionTitle = 'Latest News';
  items: NewsItem[] = [];

  loading = false;
  saving = false;
  deleting = false;
  isEditMode = false;

  message = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadLatestNews();
  }

  ngOnDestroy(): void {
    this.clearImagePreviews();
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

  private extractImageUrl(item: any, images: any[], index: number): string {
    // Use the imageField supplied by the API.
    const imageField =
      item?.imageField ?? `items[${index}].image`;

    // Find the matching image from the separate images array.
    const imageData = images.find(
      (image: any) => image.field === imageField
    );

    if (imageData?.url) {
      return imageData.url;
    }

    // Fallback for older API response formats.
    const image =
      item?.imageUrl ??
      item?.imageURL ??
      item?.image_url ??
      item?.image;

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

  private createEmptyItem(index: number): NewsItem {
    return {
      id: `latest-news-${index + 1}`,
      slug: `latest-news-${index + 1}`,
      title: '',
      description: '',
      date: '',
      imageAlt: '',
      imageFile: null,
      imagePreview: '',
      existingImageUrl: '',
    };
  }

  loadLatestNews(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .getLatestNews()
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

          this.clearImagePreviews();

          this.sectionTitle = data.title ?? 'Latest News';

          const uploadedImages = Array.isArray(data.images)
            ? data.images
            : [];

          this.items = Array.isArray(data.items)
            ? data.items.map((item: any, index: number) => {
                const imageUrl = this.extractImageUrl(
                  item,
                  uploadedImages,
                  index
                );

                const defaultId = `latest-news-${index + 1}`;

                return {
                  id: item.id ?? defaultId,
                  slug: item.slug ?? item.id ?? defaultId,
                  title: item.title ?? '',
                  description: item.description ?? '',
                  date: item.date ?? '',
                  imageAlt: item.imageAlt ?? '',
                  imageFile: null,
                  imagePreview: '',
                  existingImageUrl: imageUrl,
                };
              })
            : [];

          this.isEditMode = !!(
            data.id ||
            data.title ||
            this.items.length > 0
          );
        },

        error: (error: any) => {
          if (error.status === 404) {
            this.isEditMode = false;
            this.items = [];
            this.message =
              'No latest news content found. You can create it below.';
            return;
          }

          this.errorMessage =
            error?.error?.message ??
            'Failed to load latest news.';
        },
      });
  }

  addItem(): void {
    this.items.push(this.createEmptyItem(this.items.length));
  }

  removeItem(index: number): void {
    if (index < 0 || index >= this.items.length) {
      return;
    }

    this.revokeUrl(this.items[index].imagePreview);
    this.items.splice(index, 1);
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Each image must be less than 5 MB.';
      input.value = '';
      return;
    }

    const item = this.items[index];

    if (!item) return;

    this.errorMessage = '';

    this.revokeUrl(item.imagePreview);

    item.imageFile = file;
    item.imagePreview = URL.createObjectURL(file);
  }

  private makeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  saveLatestNews(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.sectionTitle.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Please add at least one news item.';
      return;
    }

    for (let index = 0; index < this.items.length; index++) {
      const item = this.items[index];

      if (
        !item.title.trim() ||
        !item.description.trim() ||
        !item.date.trim()
      ) {
        this.errorMessage =
          `Please complete the title, description, and date for item ${index + 1}.`;
        return;
      }

      if (!item.imageFile && !item.existingImageUrl) {
        this.errorMessage =
          `Please upload an image for item ${index + 1}.`;
        return;
      }
    }

    const content = {
      title: this.sectionTitle.trim(),

      items: this.items.map((item, index) => {
        const slug =
          item.slug.trim() || this.makeSlug(item.title);

        return {
          id: item.id.trim() || `latest-news-${index + 1}`,
          slug,
          title: item.title.trim(),
          description: item.description.trim(),
          date: item.date.trim(),
          imageField: `items[${index}].image`,
          imageAlt: item.imageAlt.trim() || item.title.trim(),
        };
      }),
    };

    const itemImages: Record<number, File> = {};

    this.items.forEach((item, index) => {
      if (item.imageFile) {
        itemImages[index] = item.imageFile;
      }
    });

    this.saving = true;

    const request = this.isEditMode
      ? this.api.updateLatestNews(content, itemImages)
      : this.api.createLatestNews(content, itemImages);

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.message =
            response?.message ??
            (this.isEditMode
              ? 'Latest news updated successfully.'
              : 'Latest news created successfully.');

          this.loadLatestNews();
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Failed to save latest news.';
        },
      });
  }

  deleteLatestNews(): void {
    if (
      !confirm(
        'Are you sure you want to delete the entire Latest News section?'
      )
    ) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .deleteLatestNews()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.clearImagePreviews();

          this.sectionTitle = 'Latest News';
          this.items = [];
          this.isEditMode = false;

          this.message =
            'Latest News section deleted successfully.';
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Failed to delete latest news.';
        },
      });
  }

  resetForm(): void {
    this.loadLatestNews();
  }

  private clearImagePreviews(): void {
    this.items.forEach((item) => {
      this.revokeUrl(item.imagePreview);
    });
  }

  private revokeUrl(url: string): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}