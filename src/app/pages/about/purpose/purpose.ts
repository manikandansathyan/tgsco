
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-purpose',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purpose.html',
  styleUrl: './purpose.css'
})
export class Purpose implements OnInit {
  label = 'Our Purpose';

  title =
    'TGSCO EXISTS TO ENSURE THAT TELANGANA’S HANDLOOM HERITAGE IS NOT JUST REMEMBERED BUT LIVED. WE WORK TO:';

  points: string[] = [
    'Support artisans through fair trade and direct market access.',
    'Preserve endangered weaving traditions before they are lost.',
    'Create sustainable livelihoods for weaving families across generations.',
    'Carry Telangana handlooms beyond state and national borders, to a global audience that values authenticity.'
  ];

  purposeImage: File | null = null;
  purposeImageUrl = '';
  purposeImagePreview = '';

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPurpose();
  }

loadPurpose(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.api.getPurposeAPI()
    .pipe(
      timeout(60000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    )
    .subscribe({
      next: (response: any) => {
        const responseData = response?.data ?? response;
        const data = responseData?.content ?? responseData;

        if (!data || typeof data !== 'object') {
          this.isExistingContent = false;
          return;
        }

        this.isExistingContent = !!responseData?.id;

        // Load section label and title
        this.label = data.label ?? 'Our Purpose';
        this.title = data.title ?? '';

        // Load purpose points
        if (Array.isArray(data.points)) {
          this.points = data.points.map(
            (point: unknown) => String(point ?? '')
          );
        }

        // Find purpose image from the images array
        const images = Array.isArray(responseData?.images)
          ? responseData.images
          : [];

        const purposeImage = images.find(
          (image: any) => image.field === 'purposeImage'
        );

        // Set image URL and preview
        this.purposeImageUrl =
          purposeImage?.url ??
          this.getImageUrl(
            data.purposeImageUrl ??
            data.purposeImage ??
            data.imageUrl ??
            data.image
          );

        this.purposeImagePreview = this.purposeImageUrl;

        this.cdr.markForCheck();
      },

      error: (error: any) => {
        console.error('Failed to load purpose content:', error);

        if (error?.status === 404) {
          this.isExistingContent = false;
        } else {
          this.errorMessage =
            error?.error?.message ||
            'Unable to load purpose content.';
        }

        this.cdr.markForCheck();
      }
    });
}

  private getImageUrl(value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof value.url === 'string') {
      return value.url;
    }

    if (value && typeof value.secure_url === 'string') {
      return value.secure_url;
    }

    return '';
  }

  addPoint(): void {
    this.points.push('');
  }

  removePoint(index: number): void {
    if (this.points.length <= 1) {
      this.errorMessage = 'At least one purpose point is required.';
      return;
    }

    this.points.splice(index, 1);
    this.errorMessage = '';
  }

  onPurposeImageSelected(event: Event): void {
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

    this.purposeImage = file;
    this.purposeImagePreview = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  savePurpose(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.label.trim()) {
      this.errorMessage = 'Please enter the section label.';
      return;
    }

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the purpose title.';
      return;
    }

    if (
      this.points.some(point => !point.trim())
    ) {
      this.errorMessage = 'Please complete or remove empty purpose points.';
      return;
    }

    const content = {
      label: this.label.trim(),
      title: this.title.trim(),
      points: this.points.map(point => point.trim())
    };

    this.isSaving = true;

    const request = this.isExistingContent
      ? this.api.updatePurposeAPI(content, this.purposeImage)
      : this.api.addPurposeAPI(content, this.purposeImage);

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
        next: (response: any) => {
          this.isExistingContent = true;
          this.purposeImage = null;

          this.successMessage =
            response?.message || 'Purpose content saved successfully.';

          this.loadPurpose();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to save purpose content:', error);

          this.errorMessage =
            error?.error?.message ||
            'Unable to save purpose content. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  deletePurpose(): void {
    if (!window.confirm('Are you sure you want to delete the Our Purpose content?')) {
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api.deletePurposeAPI()
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
          this.label = 'Our Purpose';
          this.title =
            'TGSCO EXISTS TO ENSURE THAT TELANGANA’S HANDLOOM HERITAGE IS NOT JUST REMEMBERED BUT LIVED. WE WORK TO:';

          this.points = [
            'Support artisans through fair trade and direct market access.',
            'Preserve endangered weaving traditions before they are lost.',
            'Create sustainable livelihoods for weaving families across generations.',
            'Carry Telangana handlooms beyond state and national borders, to a global audience that values authenticity.'
          ];

          this.purposeImage = null;
          this.purposeImageUrl = '';
          this.purposeImagePreview = '';
          this.isExistingContent = false;

          this.successMessage = 'Purpose content deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete purpose content:', error);

          this.errorMessage =
            error?.error?.message ||
            'Unable to delete purpose content.';

          this.cdr.markForCheck();
        }
      });
  }
  trackByIndex(index: number): number {
  return index;
}
}
