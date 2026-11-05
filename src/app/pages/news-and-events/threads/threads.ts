import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface Weaver {
  id: string;
  slug: string;
  subheading: string;
  description: string;
  mainImageAlt: string;
  mainImageUrl: string;
  mainImageFile: File | null;
  previewUrl: string;
}

@Component({
  selector: 'app-threads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './threads.html',
  styleUrl: './threads.css',
})
export class Threads implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);
  private subscription = new Subscription();

  sectionTitle = 'Threads of Triumph';
  previousLabel = 'Previous';
  nextLabel = 'Next';

  items: Weaver[] = [];

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditMode = false;

  successMessage = '';
  errorMessage = '';

  private readonly defaultDescription =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  ngOnInit(): void {
    this.loadThreads();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.clearPreviews();
  }

  private createEmptyWeaver(index: number): Weaver {
    return {
      id: `featured-weaver-${index + 1}`,
      slug: `featured-weaver-${index + 1}`,
      subheading: 'FEATURES ON INDIVIDUAL WEAVERS',
      description: this.defaultDescription,
      mainImageAlt: 'TGSCO handloom weaver at work',
      mainImageUrl: '',
      mainImageFile: null,
      previewUrl: '',
    };
  }

  private clearPreviews(): void {
    this.items.forEach((item) => {
      this.revokeUrl(item.previewUrl);
    });
  }

  private revokeUrl(url: string): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private extractData(response: any): any {
    const data = response?.data ?? response ?? {};

    let content = data.content ?? {};

    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = {};
      }
    }

    return {
      ...data,
      ...content,
      images: Array.isArray(data.images) ? data.images : [],
    };
  }

  private extractImageUrl(data: any, field: string): string {
    const image = data.images?.find(
      (entry: any) => entry.field === field
    );

    return image?.url ?? '';
  }

  loadThreads(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscription.add(
      this.api
        .getThreadsOfTriumph()
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (response: any) => {
            const data = this.extractData(response);

            this.clearPreviews();

            this.sectionTitle = data.title || 'Threads of Triumph';

            this.previousLabel =
              data.navigation?.previousLabel || 'Previous';

            this.nextLabel =
              data.navigation?.nextLabel || 'Next';

            const apiItems = Array.isArray(data.items)
              ? data.items
              : [];

            this.items = Array.from({ length: 4 }, (_, index) => {
              const item = apiItems[index] || {};

              const imageField =
                item.mainImageField || `items[${index}].mainImage`;

              const imageUrl = this.extractImageUrl(data, imageField);

              return {
                ...this.createEmptyWeaver(index),
                id: item.id || `featured-weaver-${index + 1}`,
                slug: item.slug || `featured-weaver-${index + 1}`,
                subheading:
                  item.subheading || 'FEATURES ON INDIVIDUAL WEAVERS',
                description: item.description || this.defaultDescription,
                mainImageAlt:
                  item.mainImageAlt || 'TGSCO handloom weaver at work',
                mainImageUrl: imageUrl,
                mainImageFile: null,
                previewUrl: imageUrl,
              };
            });

            this.isEditMode = apiItems.length > 0;
          },
          error: (error: any) => {
            if (error.status === 404) {
              this.isEditMode = false;
              this.items = Array.from({ length: 4 }, (_, index) =>
                this.createEmptyWeaver(index)
              );
              return;
            }

            this.errorMessage =
              error?.error?.message ||
              'Unable to load Threads of Triumph. Please try again.';
          },
        })
    );
  }

  loadFeaturedWeaver(index: number): void {
    const item = this.items[index];

    if (!item?.id) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.subscription.add(
      this.api
        .getFeaturedWeaver(item.id)
        .pipe(
          timeout(60000),
          finalize(() => this.cdr.markForCheck())
        )
        .subscribe({
          next: (response: any) => {
            const data = this.extractData(response);

            const imageField =
              data.mainImageField || `items[${index}].mainImage`;

            const imageUrl =
              this.extractImageUrl(data, imageField) ||
              this.extractImageUrl(
                { images: response?.data?.images ?? [] },
                imageField
              );

            this.revokeUrl(item.previewUrl);

            this.items[index] = {
              ...item,
              ...data,
              mainImageUrl: imageUrl || item.mainImageUrl,
              previewUrl: item.mainImageFile
                ? item.previewUrl
                : imageUrl || item.previewUrl,
              mainImageFile: item.mainImageFile,
            };

            this.successMessage = `Loaded ${item.id}.`;
          },
          error: (error: any) => {
            this.errorMessage =
              error?.error?.message || `Unable to load ${item.id}.`;
          },
        })
    );
  }

  addWeaver(): void {
    if (this.items.length >= 4) {
      this.errorMessage = 'This section supports four weaver items.';
      return;
    }

    this.items.push(this.createEmptyWeaver(this.items.length));
    this.errorMessage = '';
    this.successMessage = '';
  }

  removeWeaver(index: number): void {
    const item = this.items[index];

    this.revokeUrl(item?.previewUrl);
    this.items.splice(index, 1);

    this.successMessage = '';
    this.errorMessage = '';
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
      this.errorMessage = 'Image size must not exceed 5 MB.';
      input.value = '';
      return;
    }

    const item = this.items[index];

    this.revokeUrl(item.previewUrl);

    item.mainImageFile = file;
    item.previewUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.successMessage = '';
  }

  private makeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  saveThreads(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.sectionTitle.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.items.length !== 4) {
      this.errorMessage = 'Please provide exactly four weaver items.';
      return;
    }

    for (let index = 0; index < this.items.length; index++) {
      const item = this.items[index];

      if (!item.subheading.trim() || !item.description.trim()) {
        this.errorMessage =
          `Please complete the text fields for weaver ${index + 1}.`;
        return;
      }

      if (!item.mainImageFile && !item.mainImageUrl) {
        this.errorMessage =
          `Please upload an image for weaver ${index + 1}.`;
        return;
      }
    }

    const content = {
      title: this.sectionTitle.trim(),
      items: this.items.map((item, index) => ({
        id: item.id.trim() || `featured-weaver-${index + 1}`,
        slug:
          item.slug.trim() ||
          this.makeSlug(item.id || item.subheading) ||
          `featured-weaver-${index + 1}`,
        subheading: item.subheading.trim(),
        description: item.description.trim(),
        mainImageField: `items[${index}].mainImage`,
        mainImageAlt: item.mainImageAlt.trim() || item.subheading.trim(),
      })),
      navigation: {
        previousLabel: this.previousLabel.trim() || 'Previous',
        nextLabel: this.nextLabel.trim() || 'Next',
      },
    };

    const images: Record<number, File> = {};

    this.items.forEach((item, index) => {
      if (item.mainImageFile) {
        images[index] = item.mainImageFile;
      }
    });

    this.isSaving = true;

    const request = this.isEditMode
      ? this.api.updateThreadsOfTriumph(content, images)
      : this.api.createThreadsOfTriumph(content, images);

    this.subscription.add(
      request
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isSaving = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            this.successMessage = this.isEditMode
              ? 'Threads of Triumph updated successfully.'
              : 'Threads of Triumph created successfully.';

            this.isEditMode = true;
            this.loadThreads();
          },
          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ||
              'Unable to save Threads of Triumph. Please check the fields and try again.';
          },
        })
    );
  }

  deleteThreads(): void {
    if (
      !confirm(
        'Are you sure you want to delete the entire Threads of Triumph section?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscription.add(
      this.api
        .deleteThreadsOfTriumph()
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isDeleting = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            this.clearPreviews();

            this.items = Array.from({ length: 4 }, (_, index) =>
              this.createEmptyWeaver(index)
            );

            this.sectionTitle = 'Threads of Triumph';
            this.previousLabel = 'Previous';
            this.nextLabel = 'Next';
            this.isEditMode = false;

            this.successMessage =
              'Threads of Triumph deleted successfully.';
          },
          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ||
              'Unable to delete Threads of Triumph. Please try again.';
          },
        })
    );
  }

  resetForm(): void {
    if (!confirm('Discard your unsaved changes?')) return;

    this.loadThreads();
  }
}