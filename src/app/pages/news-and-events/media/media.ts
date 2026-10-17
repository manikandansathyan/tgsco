
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Api } from '../../../core/services/api';

interface GalleryImage {
  alt: string;
  url: string;
  file: File | null;
  previewUrl: string;
}

interface GalleryCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  mainImageAlt: string;
  mainImageUrl: string;
  mainImageFile: File | null;
  mainPreviewUrl: string;
  associatedImages: GalleryImage[];
}

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './media.html',
  styleUrl: './media.css',
})
export class Media implements OnInit, OnDestroy {
  private api = inject(Api);
  private subscriptions = new Subscription();

  sectionTitle = 'Media Gallery';
  categories: GalleryCategory[] = [];

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditMode = false;

  successMessage = '';
  errorMessage = '';

  private readonly defaultDescription =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  private readonly defaultCategories = [
    {
      id: 'exhibitions',
      title: 'Exhibitions',
      mainImageAlt: 'Handloom exhibition textiles',
      associatedAlts: [
        'Handloom threads on a loom',
        'Women examining handloom fabric',
      ],
    },
    {
      id: 'weaving-villages',
      title: 'Weaving villages',
      mainImageAlt: 'Weaving village',
      associatedAlts: [],
    },
    {
      id: 'campaigns',
      title: 'Campaigns',
      mainImageAlt: 'TGSCO handloom campaign',
      associatedAlts: [],
    },
    {
      id: 'cooperative-events',
      title: 'Cooperative events',
      mainImageAlt: 'Cooperative event',
      associatedAlts: [],
    },
  ];

  ngOnInit(): void {
    this.loadMediaGallery();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearPreviews();
  }

  private emptyImage(alt = ''): GalleryImage {
    return {
      alt,
      url: '',
      file: null,
      previewUrl: '',
    };
  }

  private createCategory(
    config: (typeof this.defaultCategories)[number],
    index: number
  ): GalleryCategory {
    return {
      id: config.id,
      slug: config.id,
      title: config.title,
      description: this.defaultDescription,
      mainImageAlt: config.mainImageAlt,
      mainImageUrl: '',
      mainImageFile: null,
      mainPreviewUrl: '',
      associatedImages: config.associatedAlts.map((alt) =>
        this.emptyImage(alt)
      ),
    };
  }

  private revokeUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private clearPreviews(): void {
    for (const category of this.categories) {
      this.revokeUrl(category.mainPreviewUrl);

      for (const image of category.associatedImages) {
        this.revokeUrl(image.previewUrl);
      }
    }
  }

  private extractPayload(response: any): any {
    let payload = response?.data ?? response;

    if (payload?.content) {
      if (typeof payload.content === 'string') {
        try {
          payload = JSON.parse(payload.content);
        } catch {
          // Keep the original payload when content is not JSON.
        }
      } else if (typeof payload.content === 'object') {
        payload = payload.content;
      }
    }

    return payload;
  }

  private imageUrl(value: any): string {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return '';

    const keys = [
      'url',
      'imageUrl',
      'image_url',
      'mainImageUrl',
      'mainImage',
      'image',
      'src',
    ];

    for (const key of keys) {
      const candidate = value[key];

      if (typeof candidate === 'string') return candidate;

      if (candidate && typeof candidate === 'object') {
        const nested = this.imageUrl(candidate);
        if (nested) return nested;
      }
    }

    return '';
  }

  private normalizeCategory(
    apiCategory: any,
    index: number
  ): GalleryCategory {
    const config =
      this.defaultCategories[index] || {
        id: `category-${index + 1}`,
        title: `Category ${index + 1}`,
        mainImageAlt: '',
        associatedAlts: [],
      };

    const fallback = this.createCategory(config, index);
    const apiImages = Array.isArray(apiCategory?.associatedImages)
      ? apiCategory.associatedImages
      : [];

    return {
      ...fallback,
      ...apiCategory,
      id: apiCategory?.id || config.id,
      slug: apiCategory?.slug || apiCategory?.id || config.id,
      title: apiCategory?.title || config.title,
      description: apiCategory?.description || '',
      mainImageAlt:
        apiCategory?.mainImageAlt || config.mainImageAlt,
      mainImageUrl: this.imageUrl(
        apiCategory?.mainImageUrl ??
          apiCategory?.mainImage ??
          apiCategory?.image
      ),
      mainImageFile: null,
      mainPreviewUrl: this.imageUrl(
        apiCategory?.mainImageUrl ??
          apiCategory?.mainImage ??
          apiCategory?.image
      ),
      associatedImages: apiImages.map((image: any, imageIndex: number) => {
        const url = this.imageUrl(image);

        return {
          alt:
            image?.alt ||
            config.associatedAlts[imageIndex] ||
            `Gallery image ${imageIndex + 1}`,
          url,
          file: null,
          previewUrl: url,
        };
      }),
    };
  }

  loadMediaGallery(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api.getMediaGallery().subscribe({
        next: (response: any) => {
          const payload = this.extractPayload(response);
          const apiCategories = Array.isArray(payload?.categories)
            ? payload.categories
            : [];

          this.clearPreviews();

          this.sectionTitle = payload?.title || 'Media Gallery';

          this.categories = this.defaultCategories.map(
            (config, index) => {
              const match = apiCategories.find(
                (category: any) => category?.id === config.id
              );

              return this.normalizeCategory(match || {}, index);
            }
          );

          this.isEditMode = apiCategories.length > 0;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message ||
            'Unable to load the Media Gallery.';
        },
      })
    );
  }

  loadCategory(index: number): void {
    const category = this.categories[index];
    if (!category?.id) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api.getMediaGalleryCategory(category.id).subscribe({
        next: (response: any) => {
          const data = this.extractPayload(response);
          const updated = this.normalizeCategory(data, index);

          this.revokeUrl(category.mainPreviewUrl);

          category.id = updated.id;
          category.slug = updated.slug;
          category.title = updated.title;
          category.description = updated.description;
          category.mainImageAlt = updated.mainImageAlt;
          category.mainImageUrl = updated.mainImageUrl;
          category.mainPreviewUrl =
            updated.mainPreviewUrl || category.mainImageUrl;
          category.mainImageFile = null;

          category.associatedImages.forEach((image) =>
            this.revokeUrl(image.previewUrl)
          );

          category.associatedImages = updated.associatedImages;

          this.successMessage = `${category.title} loaded successfully.`;
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ||
            `Unable to load ${category.title}.`;
        },
      })
    );
  }

  onMainImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Images must not exceed 5 MB.';
      input.value = '';
      return;
    }

    const category = this.categories[index];
    this.revokeUrl(category.mainPreviewUrl);

    category.mainImageFile = file;
    category.mainPreviewUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.successMessage = '';
  }

  onAssociatedImageSelected(
    event: Event,
    categoryIndex: number,
    imageIndex: number
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Images must not exceed 5 MB.';
      input.value = '';
      return;
    }

    const image =
      this.categories[categoryIndex].associatedImages[imageIndex];

    this.revokeUrl(image.previewUrl);
    image.file = file;
    image.previewUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.successMessage = '';
  }

  addAssociatedImage(categoryIndex: number): void {
    const category = this.categories[categoryIndex];

    if (category.associatedImages.length >= 10) {
      this.errorMessage = 'Maximum 10 associated images per category.';
      return;
    }

    category.associatedImages.push(
      this.emptyImage(
        `Gallery image ${category.associatedImages.length + 1}`
      )
    );
  }

  removeAssociatedImage(
    categoryIndex: number,
    imageIndex: number
  ): void {
    const images = this.categories[categoryIndex].associatedImages;
    const image = images[imageIndex];

    this.revokeUrl(image.previewUrl);
    images.splice(imageIndex, 1);
  }

  private buildContent(): Record<string, any> {
    return {
      title: this.sectionTitle.trim(),
      categories: this.categories.map((category, categoryIndex) => ({
        id: category.id.trim(),
        slug: category.slug.trim() || category.id.trim(),
        title: category.title.trim(),
        description: category.description.trim(),
        mainImageField: `categories[${categoryIndex}].mainImage`,
        mainImageAlt:
          category.mainImageAlt.trim() || category.title.trim(),
        associatedImages: category.associatedImages.map(
          (image, imageIndex) => ({
            field: `categories[${categoryIndex}].associatedImages[${imageIndex}]`,
            alt: image.alt.trim() || `Gallery image ${imageIndex + 1}`,
          })
        ),
      })),
    };
  }

  saveMediaGallery(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.sectionTitle.trim()) {
      this.errorMessage = 'Please enter the gallery title.';
      return;
    }

    for (let i = 0; i < this.categories.length; i++) {
      const category = this.categories[i];

      if (!category.title.trim() || !category.description.trim()) {
        this.errorMessage =
          `Please complete the title and description for ${category.title}.`;
        return;
      }

      if (!category.mainImageFile && !category.mainImageUrl) {
        this.errorMessage =
          `Please upload a main image for ${category.title}.`;
        return;
      }

      for (let j = 0; j < category.associatedImages.length; j++) {
        const image = category.associatedImages[j];

        if (!image.file && !image.url) {
          this.errorMessage =
            `Please upload associated image ${j + 1} for ${category.title}.`;
          return;
        }
      }
    }

    const content = this.buildContent();
    const mainImages: Record<number, File> = {};
    const associatedImages: Record<string, File> = {};

    this.categories.forEach((category, categoryIndex) => {
      if (category.mainImageFile) {
        mainImages[categoryIndex] = category.mainImageFile;
      }

      category.associatedImages.forEach((image, imageIndex) => {
        if (image.file) {
          associatedImages[
            `categories[${categoryIndex}].associatedImages[${imageIndex}]`
          ] = image.file;
        }
      });
    });

    this.isSaving = true;

    const request = this.isEditMode
      ? this.api.updateMediaGallery(
          content,
          mainImages,
          associatedImages
        )
      : this.api.createMediaGallery(
          content,
          mainImages,
          associatedImages
        );

    this.subscriptions.add(
      request.subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = this.isEditMode
            ? 'Media Gallery updated successfully.'
            : 'Media Gallery created successfully.';

          this.loadMediaGallery();
        },
        error: (error: any) => {
          this.isSaving = false;
          this.errorMessage =
            error?.error?.message ||
            'Unable to save the Media Gallery.';
        },
      })
    );
  }

  deleteMediaGallery(): void {
    if (
      !confirm(
        'Are you sure you want to delete the entire Media Gallery?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api.deleteMediaGallery().subscribe({
        next: () => {
          this.isDeleting = false;
          this.clearPreviews();

          this.categories = this.defaultCategories.map((config, index) =>
            this.createCategory(config, index)
          );

          this.sectionTitle = 'Media Gallery';
          this.isEditMode = false;
          this.successMessage = 'Media Gallery deleted successfully.';
        },
        error: (error: any) => {
          this.isDeleting = false;
          this.errorMessage =
            error?.error?.message ||
            'Unable to delete the Media Gallery.';
        },
      })
    );
  }

  resetForm(): void {
    if (confirm('Discard your unsaved changes and reload the gallery?')) {
      this.loadMediaGallery();
    }
  }
}
