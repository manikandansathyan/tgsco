
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface CollectionItem {
  name: string;
  description: string;
  buttonText: string;
  mainImageUrl: string;
  borderImageUrl: string;
  mainImageFile: File | null;
  borderImageFile: File | null;
}

interface FeaturedCollectionsContent {
  title: string;
  description: string;
  items: CollectionItem[];
}

@Component({
  selector: 'app-featured-collections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './featured-collections.html',
  styleUrl: './featured-collections.css',
})
export class FeaturedCollections implements OnInit {
  private readonly api = inject(Api);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  content: FeaturedCollectionsContent = this.getDefaultContent();

  ngOnInit(): void {
    this.loadFeaturedCollections();
  }

  private getDefaultContent(): FeaturedCollectionsContent {
    return {
      title: 'Shop the Heritage',
      description:
        'Every product page tells you not just what youre buying, but where it comes from, who made it, and why it matters.',
      items: [
        {
          name: 'Dress Materials',
          description: 'Handloom fabrics for your next heirloom piece.',
          buttonText: 'Explore Now',
          mainImageUrl: '',
          borderImageUrl: '',
          mainImageFile: null,
          borderImageFile: null,
        },
        {
          name: 'Dupattas',
          description: 'Lightweight wraps with intricate weaves.',
          buttonText: 'Explore Now',
          mainImageUrl: '',
          borderImageUrl: '',
          mainImageFile: null,
          borderImageFile: null,
        },
        {
          name: 'Fabric by the Metre',
          description: 'Buy by length and craft your own story.',
          buttonText: 'Explore Now',
          mainImageUrl: '',
          borderImageUrl: '',
          mainImageFile: null,
          borderImageFile: null,
        },
        {
          name: 'Apparel',
          description: 'Ready-to-wear pieces rooted in heritage craft.',
          buttonText: 'Explore Now',
          mainImageUrl: '',
          borderImageUrl: '',
          mainImageFile: null,
          borderImageFile: null,
        },
        {
          name: 'Home Textiles',
          description: 'Weaves that bring warmth to your home.',
          buttonText: 'Explore Now',
          mainImageUrl: '',
          borderImageUrl: '',
          mainImageFile: null,
          borderImageFile: null,
        },
      ],
    };
  }

 loadFeaturedCollections(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.api
    .getFeaturedCollectionsAPI()
    .pipe(
      timeout(60000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    )
    .subscribe({
      next: (response: any) => {
        console.log('Featured Collections API:', response);

        const data = response?.data ?? response;
        const savedContent = data?.content ?? data;

        if (
          savedContent &&
          typeof savedContent === 'object' &&
          Array.isArray(savedContent.items)
        ) {
          const defaults = this.getDefaultContent();

          // API returns images as an array
          const returnedImages: any[] = Array.isArray(data?.images)
            ? data.images
            : [];

          this.content = {
            title: savedContent.title ?? defaults.title,
            description:
              savedContent.description ?? defaults.description,

            items: defaults.items.map((defaultItem, index) => {
              const savedItem = savedContent.items[index] ?? {};

              // Match main image using its field name
              const mainImage = returnedImages.find(
                (image: any) =>
                  image.field === `items[${index}].mainImage`
              );

              // Match border image using its field name
              const borderImage = returnedImages.find(
                (image: any) =>
                  image.field === `items[${index}].borderImage`
              );

              return {
                ...defaultItem,

                name: savedItem.name ?? defaultItem.name,
                description:
                  savedItem.description ?? defaultItem.description,
                buttonText:
                  savedItem.buttonText ?? defaultItem.buttonText,

                mainImageUrl:
                  mainImage?.url ??
                  this.getImageUrl(savedItem.mainImageUrl ?? savedItem.mainImage),

                borderImageUrl:
                  borderImage?.url ??
                  this.getImageUrl(savedItem.borderImageUrl ?? savedItem.borderImage),

                mainImageFile: null,
                borderImageFile: null,
              };
            }),
          };

          this.isExistingContent = !!data?.id;
        } else {
          this.content = this.getDefaultContent();
          this.isExistingContent = false;
        }

        console.log(
          'Mapped Featured Collections:',
          this.content.items.map((item) => ({
            name: item.name,
            mainImageUrl: item.mainImageUrl,
            borderImageUrl: item.borderImageUrl,
          }))
        );

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Failed to load Featured Collections:', error);

        this.errorMessage =
          error?.error?.message ??
          'Could not load saved Featured Collections content.';

        this.cdr.markForCheck();
      },
    });
}

  private getImageUrl(image: any): string {
    if (typeof image === 'string') {
      return image;
    }

    if (image && typeof image === 'object') {
      return image.url ?? image.secure_url ?? image.path ?? '';
    }

    return '';
  }

  onImageSelected(
    event: Event,
    index: number,
    type: 'main' | 'border'
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

    this.errorMessage = '';
    const item = this.content.items[index];

    if (type === 'main') {
      item.mainImageFile = file;
      item.mainImageUrl = URL.createObjectURL(file);
    } else {
      item.borderImageFile = file;
      item.borderImageUrl = URL.createObjectURL(file);
    }

    this.cdr.markForCheck();
  }

  private getImages(): {
    index: number;
    mainImage?: File | null;
    borderImage?: File | null;
  }[] {
    return this.content.items.map((item, index) => ({
      index,
      mainImage: item.mainImageFile,
      borderImage: item.borderImageFile,
    }));
  }

  saveFeaturedCollections(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.content.title.trim()) {
      this.errorMessage = 'Please enter a section title.';
      return;
    }

    if (this.content.items.some(
      (item) => !item.name.trim() || !item.description.trim()
    )) {
      this.errorMessage =
        'Please enter a name and description for all five collections.';
      return;
    }

    const payload = {
      title: this.content.title.trim(),
      description: this.content.description.trim(),
      items: this.content.items.map((item) => ({
        name: item.name.trim(),
        description: item.description.trim(),
        buttonText: item.buttonText.trim(),
      })),
    };

    const images = this.getImages();
    this.isSaving = true;

    const request$ = this.isExistingContent
      ? this.api.updateFeaturedCollectionsAPI(payload, images)
      : this.api.addFeaturedCollectionsAPI(payload, images);

    request$
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.isExistingContent = true;
          this.successMessage =
            response?.message ??
            (this.isExistingContent
              ? 'Featured Collections saved successfully.'
              : 'Featured Collections created successfully.');

          this.content.items.forEach((item) => {
            item.mainImageFile = null;
            item.borderImageFile = null;
          });

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to save Featured Collections:', error);
          this.errorMessage =
            error?.error?.message ??
            'Failed to save Featured Collections. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  deleteFeaturedCollections(): void {
    if (
      !confirm(
        'Are you sure you want to delete the Featured Collections section?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api
      .deleteFeaturedCollectionsAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.content = this.getDefaultContent();
          this.isExistingContent = false;
          this.successMessage =
            'Featured Collections deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to delete Featured Collections:', error);
          this.errorMessage =
            error?.error?.message ??
            'Failed to delete Featured Collections. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }
}
