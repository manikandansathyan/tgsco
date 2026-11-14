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
  subtitle: string;
  description: string;
  mainImageAlt: string;
  mainImageUrl: string;
  mainImageFile: File | null;
  mainPreviewUrl: string;
  videoLink: string;
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
  private cdr = inject(ChangeDetectorRef);
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
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  private readonly defaultCategories = [
    {
      id: 'exhibitions',
      title: 'Exhibitions',
      subtitle: 'Explore our exhibitions',
      mainImageAlt:
        'Handloom textiles and weaving materials at an exhibition',
      associatedAlts: [
        'Handloom weaving on a traditional loom',
        'Women examining handloom textiles',
      ],
    },
    {
      id: 'weaving-villages',
      title: 'Weaving villages',
      subtitle: 'Discover traditional weaving villages',
      mainImageAlt: 'Weaving village and handloom artisan',
      associatedAlts: [
        'Weaver working in a village workshop',
        'Traditional village handloom',
      ],
    },
    {
      id: 'campaigns',
      title: 'Campaigns',
      subtitle: 'Handloom awareness and support campaigns',
      mainImageAlt: 'TGSCO handloom support campaign',
      associatedAlts: [
        'TGSCO handloom campaign event',
        'Handloom support programme',
      ],
    },
    {
      id: 'cooperative-events',
      title: 'Cooperative events',
      subtitle: 'Events celebrating cooperative craftsmanship',
      mainImageAlt: 'TGSCO cooperative event',
      associatedAlts: [
        'Cooperative members at an event',
        'Artisans and cooperative members meeting',
      ],
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
    _index: number
  ): GalleryCategory {
    return {
      id: config.id,
      slug: config.id,
      title: config.title,
      subtitle: config.subtitle,
      description: this.defaultDescription,
      mainImageAlt: config.mainImageAlt,
      mainImageUrl: '',
      mainImageFile: null,
      mainPreviewUrl: '',
      videoLink: '',
      associatedImages: config.associatedAlts.map((alt) =>
        this.emptyImage(alt)
      ),
    };
  }

  private revokeUrl(url: string): void {
    if (url?.startsWith('blob:')) {
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
    const data = response?.data ?? response ?? {};

    let content = data.content ?? {};

    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = {};
      }
    }

    if (!content || typeof content !== 'object') {
      content = {};
    }

    return {
      ...data,
      ...content,
      images: Array.isArray(data.images)
        ? data.images
        : Array.isArray(content.images)
          ? content.images
          : [],
    };
  }

  private imageUrl(value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    if (!value || typeof value !== 'object') {
      return '';
    }

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

      if (typeof candidate === 'string') {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const nested = this.imageUrl(candidate);

        if (nested) {
          return nested;
        }
      }
    }

    return '';
  }

  private normalizeCategory(
    apiCategory: any,
    index: number,
    images: any[] = []
  ): GalleryCategory {
    const config =
      this.defaultCategories[index] || {
        id: `category-${index + 1}`,
        title: `Category ${index + 1}`,
        subtitle: '',
        mainImageAlt: '',
        associatedAlts: [],
      };

    const fallback = this.createCategory(config, index);

    const apiAssociatedImages = Array.isArray(
      apiCategory?.associatedImages
    )
      ? apiCategory.associatedImages
      : [];

    const mainImageField =
      apiCategory?.mainImageField ??
      `categories[${index}].mainImage`;

    const matchingMainImage = images.find(
      (image: any) => image.field === mainImageField
    );

    const mainUrl =
      matchingMainImage?.url ||
      this.imageUrl(
        apiCategory?.mainImageUrl ??
          apiCategory?.mainImage ??
          apiCategory?.image
      );

    const associatedImages: GalleryImage[] =
      apiAssociatedImages.map(
        (image: any, imageIndex: number) => {
          const imageField =
            image?.field ??
            `categories[${index}].associatedImages[${imageIndex}]`;

          const matchingImage = images.find(
            (entry: any) => entry.field === imageField
          );

          const url =
            matchingImage?.url || this.imageUrl(image);

          return {
            alt:
              image?.alt ||
              config.associatedAlts[imageIndex] ||
              `Gallery image ${imageIndex + 1}`,
            url,
            file: null,
            previewUrl: url,
          };
        }
      );

    return {
      ...fallback,
      id: apiCategory?.id || config.id,
      slug: apiCategory?.slug || apiCategory?.id || config.id,
      title: apiCategory?.title || config.title,
      subtitle: apiCategory?.subtitle ?? fallback.subtitle,
      description:
        apiCategory?.description ?? fallback.description,
      mainImageAlt:
        apiCategory?.mainImageAlt || config.mainImageAlt,
      mainImageUrl: mainUrl,
      mainImageFile: null,
      mainPreviewUrl: mainUrl,
      videoLink: apiCategory?.videoLink ?? '',
      associatedImages,
    };
  }

  loadMediaGallery(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api
        .getMediaGallery()
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (response: any) => {
            const payload = this.extractPayload(response);

            const apiCategories = Array.isArray(
              payload?.categories
            )
              ? payload.categories
              : [];

            const images = Array.isArray(payload?.images)
              ? payload.images
              : [];

            this.clearPreviews();

            this.sectionTitle =
              payload?.title || 'Media Gallery';

            this.categories = this.defaultCategories.map(
              (config, index) => {
                const match = apiCategories.find(
                  (category: any) =>
                    category?.id === config.id
                );

                return this.normalizeCategory(
                  match || {},
                  index,
                  images
                );
              }
            );

            this.isEditMode = apiCategories.length > 0;

            this.cdr.markForCheck();
          },

          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ||
              'Unable to load the Media Gallery.';
          },
        })
    );
  }

  loadCategory(index: number): void {
    const category = this.categories[index];

    if (!category?.id) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api
        .getMediaGalleryCategory(category.id)
        .pipe(
          timeout(60000),
          finalize(() => this.cdr.markForCheck())
        )
        .subscribe({
          next: (response: any) => {
            const data = this.extractPayload(response);

            const updated = this.normalizeCategory(
              data,
              index,
              Array.isArray(data.images) ? data.images : []
            );

            this.revokeUrl(category.mainPreviewUrl);

            category.id = updated.id;
            category.slug = updated.slug;
            category.title = updated.title;
            category.subtitle = updated.subtitle;
            category.description = updated.description;
            category.mainImageAlt = updated.mainImageAlt;
            category.mainImageUrl = updated.mainImageUrl;
            category.mainPreviewUrl = updated.mainPreviewUrl;
            category.mainImageFile = null;
            category.videoLink = updated.videoLink;

            category.associatedImages.forEach((image) =>
              this.revokeUrl(image.previewUrl)
            );

            category.associatedImages =
              updated.associatedImages;

            this.successMessage =
              `${category.title} loaded successfully.`;

            this.cdr.markForCheck();
          },

          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ||
              `Unable to load ${category.title}.`;
          },
        })
    );
  }

  onMainImageSelected(
    event: Event,
    index: number
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

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

    if (!category) {
      return;
    }

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

    if (!file) {
      return;
    }

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
      this.categories[categoryIndex]?.associatedImages[
        imageIndex
      ];

    if (!image) {
      return;
    }

    this.revokeUrl(image.previewUrl);

    image.file = file;
    image.previewUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.successMessage = '';
  }

  addAssociatedImage(categoryIndex: number): void {
    const category = this.categories[categoryIndex];

    if (!category) {
      return;
    }

    if (category.associatedImages.length >= 10) {
      this.errorMessage =
        'Maximum 10 associated images per category.';
      return;
    }

    category.associatedImages.push(
      this.emptyImage(
        `Gallery image ${category.associatedImages.length + 1}`
      )
    );

    this.errorMessage = '';
    this.successMessage = '';
  }

  removeAssociatedImage(
    categoryIndex: number,
    imageIndex: number
  ): void {
    const images =
      this.categories[categoryIndex]?.associatedImages;

    if (!images || !images[imageIndex]) {
      return;
    }

    this.revokeUrl(images[imageIndex].previewUrl);
    images.splice(imageIndex, 1);

    this.errorMessage = '';
    this.successMessage = '';
  }

  private buildContent(): Record<string, any> {
    return {
      title: this.sectionTitle.trim(),

      categories: this.categories.map(
        (category, categoryIndex) => ({
          id: category.id.trim(),
          slug:
            category.slug.trim() || category.id.trim(),
          title: category.title.trim(),
          subtitle: category.subtitle.trim(),
          description: category.description.trim(),

          mainImageField:
            `categories[${categoryIndex}].mainImage`,

          mainImageAlt:
            category.mainImageAlt.trim() ||
            category.title.trim(),

          associatedImages:
            category.associatedImages.map(
              (image, imageIndex) => ({
                field:
                  `categories[${categoryIndex}].associatedImages[${imageIndex}]`,
                alt:
                  image.alt.trim() ||
                  `Gallery image ${imageIndex + 1}`,
              })
            ),

          videoLink: category.videoLink.trim(),
        })
      ),
    };
  }

  saveMediaGallery(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.sectionTitle.trim()) {
      this.errorMessage = 'Please enter the gallery title.';
      return;
    }

    if (this.categories.length === 0) {
      this.errorMessage =
        'Please add at least one gallery category.';
      return;
    }

    for (const category of this.categories) {
      if (
        !category.id.trim() ||
        !category.title.trim() ||
        !category.subtitle.trim() ||
        !category.description.trim()
      ) {
        this.errorMessage =
          'Please complete the ID, title, subtitle and description for every category.';
        return;
      }

      if (
        !category.mainImageFile &&
        !category.mainImageUrl
      ) {
        this.errorMessage =
          `Please upload a main image for ${category.title}.`;
        return;
      }

      for (
        let j = 0;
        j < category.associatedImages.length;
        j++
      ) {
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

    this.categories.forEach(
      (category, categoryIndex) => {
        if (category.mainImageFile) {
          mainImages[categoryIndex] =
            category.mainImageFile;
        }

        category.associatedImages.forEach(
          (image, imageIndex) => {
            if (image.file) {
              associatedImages[
                `categories[${categoryIndex}].associatedImages[${imageIndex}]`
              ] = image.file;
            }
          }
        );
      }
    );

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
          next: () => {
            this.successMessage = this.isEditMode
              ? 'Media Gallery updated successfully.'
              : 'Media Gallery created successfully.';

            this.loadMediaGallery();
          },

          error: (error: any) => {
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
      this.api
        .deleteMediaGallery()
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isDeleting = false;
            this.api.scrollToTop();
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            this.clearPreviews();

            this.categories = this.defaultCategories.map(
              (config, index) =>
                this.createCategory(config, index)
            );

            this.sectionTitle = 'Media Gallery';
            this.isEditMode = false;

            this.successMessage =
              'Media Gallery deleted successfully.';

            this.cdr.markForCheck();
          },

          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ||
              'Unable to delete the Media Gallery.';
          },
        })
    );
  }

  resetForm(): void {
    if (
      confirm(
        'Discard your unsaved changes and reload the gallery?'
      )
    ) {
      this.loadMediaGallery();
    }
  }
}
