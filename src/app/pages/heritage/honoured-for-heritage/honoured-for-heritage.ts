import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

  private getObject(data: any): any {
    let result = data?.data ?? data;

    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch {
        return {};
      }
    }

    if (result?.content) {
      const content =
        typeof result.content === 'string'
          ? this.parseContent(result.content)
          : result.content;

      return {
        ...result,
        ...content,
      };
    }

    return result ?? {};
  }

  private parseContent(content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private getImageUrl(item: any): string {
    if (typeof item === 'string') {
      return item;
    }

    return (
      item?.imageUrl ??
      item?.imageURL ??
      item?.image_url ??
      item?.image?.url ??
      item?.image?.imageUrl ??
      item?.image?.secure_url ??
      item?.image?.path ??
      item?.image ??
      item?.url ??
      ''
    );
  }

  loadAwards(): void {
    this.loading = true;
    this.errorMessage = '';
    this.message = '';

    this.api.getHeritageAwards().subscribe({
      next: (response: any) => {
        const data = this.getObject(response);

        this.title = data.title ?? 'Honoured for Heritage';
        this.description = data.description ?? '';

        this.clearAwardPreviews();

        this.awards = Array.isArray(data.awards)
          ? data.awards.map((item: any) => {
              const imageUrl = this.getImageUrl(item);

              return {
                title: item.title ?? '',
                description: item.description ?? '',
                imageAlt: item.imageAlt ?? '',
                imageUrl,
                imagePreview: '',
                existingImageUrl: imageUrl,
                imageFile: null,
              };
            })
          : [];

        const iconUrl = this.getImageUrl(
          data.decorativeIcon ?? data.icon ?? data.decorative_icon
        );

        this.existingDecorativeIconUrl = iconUrl;
        this.decorativeIconPreview = '';
        this.decorativeIconFile = null;
        this.isEditMode =
          !!data.title ||
          !!data.description ||
          this.awards.length > 0;

        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;

        if (error.status === 404) {
          this.isEditMode = false;
          this.message = 'No awards content found. You can create it below.';
          return;
        }

        this.errorMessage =
          error?.error?.message ?? 'Failed to load awards content.';
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
    this.revokeUrl(this.awards[index]?.imagePreview);
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

    this.revokeUrl(award.imagePreview);

    award.imageFile = file;
    award.imagePreview = URL.createObjectURL(file);
    award.imageUrl = '';
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
  }

  private isValidImage(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must be less than 5 MB.';
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

    const request = this.isEditMode
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

    request.subscribe({
      next: (response: any) => {
        this.saving = false;
        this.message =
          response?.message ??
          (this.isEditMode
            ? 'Awards updated successfully.'
            : 'Awards created successfully.');

        this.loadAwards();
      },
      error: (error: any) => {
        this.saving = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to save awards content.';
      },
    });
  }

  deleteAwards(): void {
    if (!confirm('Are you sure you want to delete the entire awards section?')) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api.deleteHeritageAwards().subscribe({
      next: () => {
        this.deleting = false;
        this.clearAllPreviews();

        this.title = 'Honoured for Heritage';
        this.description = '';
        this.awards = [];
        this.decorativeIconFile = null;
        this.decorativeIconPreview = '';
        this.existingDecorativeIconUrl = '';
        this.isEditMode = false;
        this.message = 'Awards section deleted successfully.';
      },
      error: (error: any) => {
        this.deleting = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to delete awards content.';
      },
    });
  }

  resetForm(): void {
    this.loadAwards();
  }

  private clearAwardPreviews(): void {
    this.awards.forEach((award) => {
      this.revokeUrl(award.imagePreview);
    });
  }

  private clearAllPreviews(): void {
    this.clearAwardPreviews();
    this.revokeUrl(this.decorativeIconPreview);
  }

  private revokeUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
