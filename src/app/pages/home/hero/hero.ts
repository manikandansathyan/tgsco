import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api, HeroImageUpload } from '../../../core/services/api';

interface HeroSlide {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  altText: string;
  imageUrl: string;
  imageFile: File | null;
}

type ModalMode = 'preview' | 'create' | 'edit';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements OnInit {
  slides: HeroSlide[] = [];

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  errorMessage = '';
  successMessage = '';

  isModalOpen = false;
  modalMode: ModalMode = 'preview';
  selectedSlideIndex = 0;

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHeroContent();
  }

  createEmptySlide(): HeroSlide {
    return {
      eyebrow: '',
      title: '',
      highlight: '',
      description: '',
      buttonLabel: '',
      buttonUrl: '',
      altText: '',
      imageUrl: '',
      imageFile: null,
    };
  }

  loadHeroContent(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getHeroAPI()
      .pipe(
        timeout(60000), // Render free tier can take ~60s to wake up
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          const slideData: any[] = Array.isArray(data?.content?.slides)
            ? data.content.slides
            : [];
          const images: any[] = Array.isArray(data?.images) ? data.images : [];

          this.slides = slideData.map((item, index): HeroSlide => {
            const fieldName = item.imageField ?? `slides[${index}].image`;
            const image = images.find((img) => img.field === fieldName);

            return {
              eyebrow: item.eyebrow ?? '',
              title: item.title ?? '',
              highlight: item.highlight ?? '',
              description: item.description ?? '',
              buttonLabel: item.button?.label ?? '',
              buttonUrl: item.button?.url ?? '',
              altText: item.alt ?? '',
              imageUrl: image?.url ?? '',
              imageFile: null,
            };
          });

          this.isExistingContent = this.slides.length > 0;
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Hero API error:', error);
          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ?? 'Unable to load hero content.';
          this.slides = [];
          this.isExistingContent = false;
          this.cdr.markForCheck();
        },
      });
  }

  openPreview(index: number): void {
    this.selectedSlideIndex = index;
    this.modalMode = 'preview';
    this.isModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openCreateModal(): void {
    if (this.slides.length >= 3) {
      this.errorMessage = 'You can add a maximum of 3 hero slides.';
      return;
    }

    this.slides.push(this.createEmptySlide());
    this.selectedSlideIndex = this.slides.length - 1;
    this.modalMode = 'create';
    this.isModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  editSelectedSlide(): void {
    this.modalMode = 'edit';
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    if (this.modalMode === 'create') {
      this.slides.splice(this.selectedSlideIndex, 1);
    }

    this.isModalOpen = false;
    this.errorMessage = '';
  }

  onImageSelected(event: Event): void {
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

    const slide = this.slides[this.selectedSlideIndex];
    if (!slide) {
      return;
    }

    if (slide.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(slide.imageUrl);
    }

    slide.imageFile = file;
    slide.imageUrl = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  saveHeroContent(): void {
    if (this.slides.length === 0) {
      this.errorMessage = 'Add at least one hero slide.';
      return;
    }

    if (this.slides.some((slide) => !slide.title.trim())) {
      this.errorMessage = 'Please enter a heading for every slide.';
      return;
    }

    if (this.slides.some((slide) => !slide.imageUrl)) {
      this.errorMessage = 'Please upload an image for every slide.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const content = {
      slides: this.slides.map((slide, index) => ({
        eyebrow: slide.eyebrow,
        title: slide.title,
        highlight: slide.highlight,
        description: slide.description,
        button: {
          label: slide.buttonLabel,
          url: slide.buttonUrl,
        },
        imageField: `slides[${index}].image`,
        alt: slide.altText,
      })),
    };

    // keep each file paired with its slide position
    const images: HeroImageUpload[] = this.slides
      .map((slide, index) => ({ index, file: slide.imageFile }))
      .filter((item): item is HeroImageUpload => item.file !== null);

    const request$ = this.isExistingContent
      ? this.api.updateHeroAPI(content, images)
      : this.api.addHeroAPI(content, images);

    request$
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.successMessage = 'Hero content saved successfully.';
          this.cdr.markForCheck();
          this.loadHeroContent();
        },
        error: (error: any) => {
          console.error('Save hero error:', error);
          this.errorMessage =
            error?.error?.message ?? 'Failed to save hero content.';
          this.cdr.markForCheck();
        },
      });
  }

  deleteHeroSection(): void {
    if (!confirm('Are you sure you want to delete the entire Hero Section?')) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteHeroAPI()
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.slides = [];
          this.isExistingContent = false;
          this.isModalOpen = false;
          this.successMessage = 'Hero section deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Delete hero error:', error);
          this.errorMessage =
            error?.error?.message ?? 'Failed to delete hero section.';
          this.cdr.markForCheck();
        },
      });
  } 

  trackByIndex(index: number): number {
    return index;
  }
}
