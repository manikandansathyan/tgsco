
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface VisionContent {
  label: string;
  statement: string;
}

@Component({
  selector: 'app-vision',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vision.html',
  styleUrl: './vision.css'
})
export class Vision implements OnInit {
  content: VisionContent = this.getDefaultContent();

  visionImage: File | null = null;
  visionImageUrl = '';
  visionImagePreview = '';

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly api: Api,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVision();
  }

  private getDefaultContent(): VisionContent {
    return {
      label: 'OUR VISION',
      statement:
        'To establish Telangana as a globally recognised centre of authentic, sustainable handloom craftsmanship, where every weaver thrives and every tradition endures.'
    };
  }

loadVision(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.api
    .getVisionAPI()
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

        if (
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          (
            data.label !== undefined ||
            data.statement !== undefined
          )
        ) {
          this.content = {
            label: data.label ?? 'OUR VISION',
            statement: data.statement ?? ''
          };

          // Find the vision image from the images array
          const matchedImage = Array.isArray(responseData?.images)
            ? responseData.images.find(
                (image: any) => image.field === 'visionImage'
              )
            : null;

          // Fallback for older API response formats
          const fallbackImage =
            data.visionImageUrl ??
            data.vision_image_url ??
            data.visionImage ??
            data.vision_image ??
            data.imageUrl ??
            data.image ??
            '';

          this.visionImageUrl =
            matchedImage?.url ??
            (
              typeof fallbackImage === 'string'
                ? fallbackImage
                : fallbackImage?.url ?? ''
            );

          this.visionImagePreview = this.visionImageUrl;

          this.isExistingContent = !!responseData?.id;
        } else {
          this.content = this.getDefaultContent();
          this.visionImageUrl = '';
          this.visionImagePreview = '';
          this.isExistingContent = false;
        }

        this.visionImage = null;
        this.successMessage = '';

        this.cdr.markForCheck();
      },

      error: (error: any) => {
        console.error('Failed to load vision content:', error);

        this.errorMessage =
          error?.error?.message ??
          'Unable to load vision content. Please try again.';

        this.cdr.markForCheck();
      }
    });
}

  onVisionImageSelected(event: Event): void {
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

    this.visionImage = file;
    this.visionImagePreview = URL.createObjectURL(file);
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  cancelImageChange(): void {
    this.visionImage = null;
    this.visionImagePreview = this.visionImageUrl;
  }

  saveVision(): void {
    if (this.isSaving || this.isDeleting) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: VisionContent = {
      label: this.content.label.trim(),
      statement: this.content.statement.trim()
    };

    const request = this.isExistingContent
      ? this.api.updateVisionAPI(payload, this.visionImage)
      : this.api.addVisionAPI(payload, this.visionImage);

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.content = payload;
          this.isExistingContent = true;
          this.successMessage =
            response?.message ?? 'Vision content saved successfully.';

          this.visionImage = null;
          this.loadVision();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to save vision content:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to save vision content. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  deleteVision(): void {
    if (!this.isExistingContent || this.isDeleting || this.isSaving) {
      return;
    }

    if (!window.confirm('Are you sure you want to delete the vision content?')) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteVisionAPI()
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
          this.visionImage = null;
          this.visionImageUrl = '';
          this.visionImagePreview = '';
          this.isExistingContent = false;
          this.successMessage = 'Vision content deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete vision content:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to delete vision content. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  resetForm(): void {
    this.content = this.getDefaultContent();
    this.visionImage = null;
    this.visionImagePreview = this.visionImageUrl;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
