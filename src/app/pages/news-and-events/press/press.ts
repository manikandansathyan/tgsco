
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

interface PressRelease {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageAlt: string;
  imageFile: File | null;
  imagePreview: string;
  existingImageUrl: string;
}

@Component({
  selector: 'app-press',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './press.html',
  styleUrl: './press.css',
})
export class Press implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  sectionTitle = 'Press Releases';
  items: PressRelease[] = [];

  sliderIconFile: File | null = null;
  sliderIconPreview = '';
  existingSliderIconUrl = '';

  loading = false;
  saving = false;
  deleting = false;
  isEditMode = false;

  message = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadPressReleases();
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  private parseContent(value: any): any {
    if (typeof value !== 'string') return value ?? {};

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
      images: data.images ?? content.images ?? [],
    };
  }

  private extractImageUrl(
    value: any,
    images: any[],
    field: string
  ): string {
    const matchingImage = images.find(
      (image: any) => image.field === field
    );

    if (matchingImage?.url) {
      return matchingImage.url;
    }

    // Fallback for older API response formats.
    const image =
      value?.imageUrl ??
      value?.imageURL ??
      value?.image_url ??
      value?.image ??
      value?.url ??
      '';

    if (typeof image === 'string') return image;

    return (
      image?.url ??
      image?.imageUrl ??
      image?.secure_url ??
      image?.path ??
      ''
    );
  }

  private createEmptyItem(index: number): PressRelease {
    return {
      id: `press-release-${index + 1}`,
      slug: `press-release-${index + 1}`,
      title: '',
      description: '',
      imageAlt: '',
      imageFile: null,
      imagePreview: '',
      existingImageUrl: '',
    };
  }

  loadPressReleases(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .getPressReleases()
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

          const images = Array.isArray(data.images)
            ? data.images
            : [];

          this.clearPreviews();

          this.sectionTitle = data.title ?? 'Press Releases';

          this.items = Array.isArray(data.items)
            ? data.items.map((item: any, index: number) => {
                const fallbackId = `press-release-${index + 1}`;
                const imageField =
                  item.imageField ?? `items[${index}].image`;

                return {
                  id: item.id ?? fallbackId,
                  slug: item.slug ?? item.id ?? fallbackId,
                  title: item.title ?? '',
                  description: item.description ?? '',
                  imageAlt: item.imageAlt ?? '',
                  imageFile: null,
                  imagePreview: '',
                  existingImageUrl: this.extractImageUrl(
                    item,
                    images,
                    imageField
                  ),
                };
              })
            : [];

          // Slider icon is retrieved separately.
          this.existingSliderIconUrl = this.extractImageUrl(
            {
              image:
                data.sliderIconUrl ??
                data.sliderIcon ??
                data.slider_icon ??
                data.icon,
            },
            images,
            data.sliderIconField ?? 'sliderIcon'
          );

          this.sliderIconFile = null;
          this.sliderIconPreview = '';

          this.isEditMode =
            !!data.title || this.items.length > 0;

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          if (error.status === 404) {
            this.isEditMode = false;
            this.items = [];
            this.existingSliderIconUrl = '';

            this.message =
              'No Press Releases section found. You can create it below.';
            return;
          }

          this.errorMessage =
            error?.error?.message ?? 'Failed to load Press Releases.';
        },
      });
  }

  addItem(): void {
    this.items.push(this.createEmptyItem(this.items.length));
  }

  removeItem(index: number): void {
    this.revokeUrl(this.items[index]?.imagePreview);
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

    this.errorMessage = '';

    const item = this.items[index];

    this.revokeUrl(item.imagePreview);

    item.imageFile = file;
    item.imagePreview = URL.createObjectURL(file);
  }

  onSliderIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid slider icon image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'The slider icon must be less than 5 MB.';
      input.value = '';
      return;
    }

    this.errorMessage = '';

    this.revokeUrl(this.sliderIconPreview);

    this.sliderIconFile = file;
    this.sliderIconPreview = URL.createObjectURL(file);
  }

  private makeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  savePressReleases(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.sectionTitle.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Please add at least one press release.';
      return;
    }

    for (let index = 0; index < this.items.length; index++) {
      const item = this.items[index];

      if (!item.title.trim()) {
        this.errorMessage =
          `Please enter a title for press release ${index + 1}.`;
        return;
      }

      if (!item.description.trim()) {
        this.errorMessage =
          `Please enter a description for press release ${index + 1}.`;
        return;
      }

      if (!item.imageFile && !item.existingImageUrl) {
        this.errorMessage =
          `Please upload an image for press release ${index + 1}.`;
        return;
      }
    }

    const content = {
      title: this.sectionTitle.trim(),

      items: this.items.map((item, index) => ({
        id: item.id.trim() || `press-release-${index + 1}`,
        slug:
          item.slug.trim() ||
          this.makeSlug(item.id || item.title) ||
          `press-release-${index + 1}`,
        title: item.title.trim(),
        description: item.description.trim(),
        imageField: `items[${index}].image`,
        imageAlt: item.imageAlt.trim() || item.title.trim(),
      })),

      sliderIconField: 'sliderIcon',
    };

    const itemImages: Record<number, File> = {};

    this.items.forEach((item, index) => {
      if (item.imageFile) {
        itemImages[index] = item.imageFile;
      }
    });

    this.saving = true;

    const request = this.isEditMode
      ? this.api.updatePressReleases(
          content,
          itemImages,
          this.sliderIconFile ?? undefined
        )
      : this.api.createPressReleases(
          content,
          itemImages,
          this.sliderIconFile ?? undefined
        );

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
              ? 'Press Releases updated successfully.'
              : 'Press Releases created successfully.');

          this.loadPressReleases();
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ?? 'Failed to save Press Releases.';
        },
      });
  }

  deletePressReleases(): void {
    if (
      !confirm(
        'Are you sure you want to delete the entire Press Releases section?'
      )
    ) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .deletePressReleases()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.clearPreviews();

          this.sectionTitle = 'Press Releases';
          this.items = [];
          this.sliderIconFile = null;
          this.sliderIconPreview = '';
          this.existingSliderIconUrl = '';
          this.isEditMode = false;

          this.message =
            'Press Releases section deleted successfully.';
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ?? 'Failed to delete Press Releases.';
        },
      });
  }

  resetForm(): void {
    this.loadPressReleases();
  }

  private clearPreviews(): void {
    this.items.forEach((item) => {
      this.revokeUrl(item.imagePreview);
    });

    this.revokeUrl(this.sliderIconPreview);
  }

  private revokeUrl(url: string): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
