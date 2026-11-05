
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

interface Award {
  title: string;
  description: string;
  imageAlt: string;
  imageUrl: string;
  imagePreview: string;
  existingImageUrl: string;
  imageFile: File | null;
}

@Component({
  selector: 'app-honoured-for-heritage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './honoured-for-heritage.html',
  styleUrl: './honoured-for-heritage.css',
})
export class HonouredForHeritage implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  title = 'Honoured for Heritage';

  description =
    'A showcase of national and international awards, recognitions, and certifications received by TGSCO and its affiliated weavers, testimony to decades of craftsmanship and commitment.';

  awards: Award[] = [];

  decorativeIconFile: File | null = null;
  decorativeIconPreview = '';
  existingDecorativeIconUrl = '';

  loading = false;
  saving = false;
  deleting = false;
  isEditMode = false;

  message = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadAwards();
  }

  ngOnDestroy(): void {
    this.clearAllPreviews();
  }

  private getObject(response: any): any {
    const result = response?.data ?? response;

    if (!result || typeof result !== 'object') {
      return {};
    }

    let content = result.content ?? {};

    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = {};
      }
    }

    return {
      ...result,
      ...content,
      images: Array.isArray(result.images) ? result.images : [],
    };
  }

  loadAwards(): void {
    this.loading = true;
    this.errorMessage = '';
    this.message = '';

    this.api
      .getHeritageAwards()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = this.getObject(response);

          this.clearAllPreviews();

          this.title = data.title ?? 'Honoured for Heritage';
          this.description = data.description ?? '';

          const uploadedImages = Array.isArray(data.images)
            ? data.images
            : [];

          this.awards = Array.isArray(data.awards)
            ? data.awards.map((item: any, index: number) => {
                const imageField =
                  item?.imageField ?? `awards[${index}].image`;

                const uploadedImage = uploadedImages.find(
                  (image: any) => image?.field === imageField
                );

                const imageUrl = uploadedImage?.url ?? '';

                return {
                  title: item?.title ?? '',
                  description: item?.description ?? '',
                  imageAlt:
                    item?.imageAlt ?? item?.title ?? '',
                  imageUrl,
                  imagePreview: '',
                  existingImageUrl: imageUrl,
                  imageFile: null,
                };
              })
            : [];

          // Only set an icon URL if the API actually returns one.
          const decorativeIconImage = uploadedImages.find(
            (image: any) => image?.field === 'decorativeIcon'
          );

          this.existingDecorativeIconUrl =
            decorativeIconImage?.url ?? '';

          this.decorativeIconPreview = '';
          this.decorativeIconFile = null;

          this.isEditMode =
            !!data.title ||
            !!data.description ||
            this.awards.length > 0;

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          if (error?.status === 404) {
            this.isEditMode = false;
            this.awards = [];
            this.existingDecorativeIconUrl = '';
            this.message =
              'No awards content found. You can create it below.';
            return;
          }

          this.errorMessage =
            error?.error?.message ??
            'Failed to load awards content.';
        },
      });
  }

  addAward(): void {
    this.awards.push({
      title: '',
      description: '',
      imageAlt: '',
      imageUrl: '',
      imagePreview: '',
      existingImageUrl: '',
      imageFile: null,
    });
  }

  removeAward(index: number): void {
    const award = this.awards[index];

    if (!award) return;

    this.revokeUrl(award.imagePreview);
    this.awards.splice(index, 1);
  }

  onAwardImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!this.isValidImage(file)) {
      input.value = '';
      return;
    }

    const award = this.awards[index];

    if (!award) return;

    this.revokeUrl(award.imagePreview);

    award.imageFile = file;
    award.imagePreview = URL.createObjectURL(file);
    award.imageUrl = '';

    this.message = '';
  }

  removeAwardImage(index: number): void {
    const award = this.awards[index];

    if (!award) return;

    this.revokeUrl(award.imagePreview);

    award.imageFile = null;
    award.imagePreview = '';
    award.imageUrl = '';
    award.existingImageUrl = '';
  }

  onDecorativeIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!this.isValidImage(file)) {
      input.value = '';
      return;
    }

    this.revokeUrl(this.decorativeIconPreview);

    this.decorativeIconFile = file;
    this.decorativeIconPreview = URL.createObjectURL(file);

    this.message = '';
  }

  removeDecorativeIcon(): void {
    this.decorativeIconFile = null;
    this.revokeUrl(this.decorativeIconPreview);
    this.decorativeIconPreview = '';
    this.existingDecorativeIconUrl = '';
  }

  private isValidImage(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must be 5 MB or less.';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  saveAwards(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (!this.description.trim()) {
      this.errorMessage = 'Please enter the section description.';
      return;
    }

    if (this.awards.length === 0) {
      this.errorMessage = 'Please add at least one award.';
      return;
    }

    for (let index = 0; index < this.awards.length; index++) {
      const award = this.awards[index];

      if (!award.title.trim() || !award.description.trim()) {
        this.errorMessage =
          `Please enter the title and description for award ${index + 1}.`;
        return;
      }

      if (!award.imageFile && !award.existingImageUrl) {
        this.errorMessage =
          `Please upload an image for award ${index + 1}.`;
        return;
      }
    }

    const content = {
      title: this.title.trim(),
      description: this.description.trim(),

      awards: this.awards.map((award, index) => ({
        title: award.title.trim(),
        description: award.description.trim(),
        imageField: `awards[${index}].image`,
        imageAlt: award.imageAlt.trim() || award.title.trim(),
      })),

      iconField: 'decorativeIcon',
    };

    const awardImages: Record<number, File> = {};

    this.awards.forEach((award, index) => {
      if (award.imageFile) {
        awardImages[index] = award.imageFile;
      }
    });

    this.saving = true;

    const wasEditing = this.isEditMode;

    const request = wasEditing
      ? this.api.updateHeritageAwards(
          content,
          awardImages,
          this.decorativeIconFile
        )
      : this.api.createHeritageAwards(
          content,
          awardImages,
          this.decorativeIconFile
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
          this.clearAllPreviews();

          this.decorativeIconFile = null;

          this.message =
            response?.message ??
            (wasEditing
              ? 'Awards updated successfully.'
              : 'Awards created successfully.');

          this.loadAwards();
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Failed to save awards content.';
        },
      });
  }

  deleteAwards(): void {
    if (
      !window.confirm(
        'Are you sure you want to delete the entire awards section?'
      )
    ) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .deleteHeritageAwards()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.clearAllPreviews();

          this.title = 'Honoured for Heritage';
          this.description =
            'A showcase of national and international awards, recognitions, and certifications received by TGSCO and its affiliated weavers, testimony to decades of craftsmanship and commitment.';

          this.awards = [];

          this.decorativeIconFile = null;
          this.decorativeIconPreview = '';
          this.existingDecorativeIconUrl = '';

          this.isEditMode = false;

          this.message =
            response?.message ??
            'Awards section deleted successfully.';
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Failed to delete awards content.';
        },
      });
  }

  resetForm(): void {
    this.clearAllPreviews();
    this.decorativeIconFile = null;
    this.message = '';
    this.errorMessage = '';

    this.loadAwards();
  }

  private clearAwardPreviews(): void {
    this.awards.forEach((award) => {
      this.revokeUrl(award.imagePreview);
      award.imagePreview = '';
    });
  }

  private clearAllPreviews(): void {
    this.clearAwardPreviews();
    this.revokeUrl(this.decorativeIconPreview);
    this.decorativeIconPreview = '';
  }

  private revokeUrl(url: string): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  
}
