
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface ChroniclesContent {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  statistic: {
    value: string;
    label: string;
  };
  cta: {
    label: string;
    url: string;
  };
  closingQuote: string;
  leftImageAlt: string;
  rightImageAlt: string;
}

@Component({
  selector: 'app-chronicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chronicles.html',
  styleUrl: './chronicles.css',
})
export class Chronicles implements OnInit, OnDestroy {
  loading = false;
  saving = false;
  deleting = false;

  hasContent = false;
  errorMessage = '';
  successMessage = '';

  leftImageFile: File | null = null;
  rightImageFile: File | null = null;

  leftImagePreview = '';
  rightImagePreview = '';

  existingLeftImage = '';
  existingRightImage = '';

  content: ChroniclesContent = this.getEmptyContent();

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getChronicles();
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  getEmptyContent(): ChroniclesContent {
    return {
      eyebrow: '',
      title: '',
      paragraphs: ['', ''],
      statistic: {
        value: '',
        label: '',
      },
      cta: {
        label: '',
        url: '',
      },
      closingQuote: '',
      leftImageAlt: '',
      rightImageAlt: '',
    };
  }

 
getChronicles(): void {
  this.loading = true;
  this.errorMessage = '';

  this.api
    .getChroniclesOfThreadAPI()
    .pipe(
      timeout(60000),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    )
    .subscribe({
      next: (response: any) => {
        const data = response?.data;

        if (!data || response?.success === false) {
          this.hasContent = false;
          this.cdr.markForCheck();
          return;
        }

        const parsedData =
          typeof data.content === 'string'
            ? this.parseContent(data.content)
            : data.content;

        if (!parsedData || typeof parsedData !== 'object') {
          this.hasContent = false;
          this.cdr.markForCheck();
          return;
        }

        this.content = {
          eyebrow: parsedData.eyebrow ?? '',
          title: parsedData.title ?? '',
          paragraphs: Array.isArray(parsedData.paragraphs)
            ? [...parsedData.paragraphs]
            : [''],
          statistic: {
            value: parsedData.statistic?.value ?? '',
            label: parsedData.statistic?.label ?? '',
          },
          cta: {
            label: parsedData.cta?.label ?? '',
            url: parsedData.cta?.url ?? '',
          },
          closingQuote: parsedData.closingQuote ?? '',
          leftImageAlt: parsedData.leftImageAlt ?? '',
          rightImageAlt: parsedData.rightImageAlt ?? '',
        };

        if (!this.content.paragraphs.length) {
          this.content.paragraphs = [''];
        }

        // API images are returned as an array of objects.
        const images = Array.isArray(data.images) ? data.images : [];

        this.existingLeftImage =
          images.find((image: any) => image.field === 'leftImage')?.url ||
          parsedData.leftImageUrl ||
          '';

        this.existingRightImage =
          images.find((image: any) => image.field === 'rightImage')?.url ||
          parsedData.rightImageUrl ||
          '';

        this.hasContent = true;

        this.clearImagePreview();
        this.leftImageFile = null;
        this.rightImageFile = null;

        this.cdr.markForCheck();
      },
      error: (error: any) => {
        if (error.status === 404 || error.status === 204) {
          this.hasContent = false;
          this.content = this.getEmptyContent();
          this.existingLeftImage = '';
          this.existingRightImage = '';
          this.cdr.markForCheck();
          return;
        }

        this.errorMessage =
          error.error?.message || 'Unable to load Chronicles of Thread.';

        this.cdr.markForCheck();
      },
    });
}


  private parseContent(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  onImageSelected(event: Event, type: 'left' | 'right'): void {
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

    this.errorMessage = '';

    const previewUrl = URL.createObjectURL(file);

    if (type === 'left') {
      this.leftImageFile = file;
      this.revokeUrl(this.leftImagePreview);
      this.leftImagePreview = previewUrl;
    } else {
      this.rightImageFile = file;
      this.revokeUrl(this.rightImagePreview);
      this.rightImagePreview = previewUrl;
    }
  }

  addParagraph(): void {
    this.content.paragraphs.push('');
  }

  removeParagraph(index: number): void {
    if (this.content.paragraphs.length <= 1) return;
    this.content.paragraphs.splice(index, 1);
  }

  saveChronicles(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.content.title.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (!this.hasContent && (!this.leftImageFile || !this.rightImageFile)) {
      this.errorMessage = 'Please upload both left and right images.';
      return;
    }

    const formData = new FormData();

    formData.append('content', JSON.stringify(this.content));

    if (this.leftImageFile) {
      formData.append('leftImage', this.leftImageFile);
    }

    if (this.rightImageFile) {
      formData.append('rightImage', this.rightImageFile);
    }

    this.saving = true;

    const request = this.hasContent
      ? this.api.updateChroniclesOfThreadAPI(formData)
      : this.api.addChroniclesOfThreadAPI(formData);

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.errorMessage =
              response?.message || 'Unable to save Chronicles of Thread.';
            return;
          }

          this.successMessage = this.hasContent
            ? 'Chronicles of Thread updated successfully.'
            : 'Chronicles of Thread added successfully.';

          this.hasContent = true;
          this.clearImagePreview();
          this.leftImageFile = null;
          this.rightImageFile = null;

          this.getChronicles();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Something went wrong while saving.';
        },
      });
  }

  deleteChronicles(): void {
    if (!this.hasContent) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete Chronicles of Thread?'
    );

    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.deleting = true;

    this.api
      .deleteChroniclesOfThreadAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deleting = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.errorMessage =
              response?.message || 'Unable to delete Chronicles of Thread.';
            return;
          }

          this.hasContent = false;
          this.content = this.getEmptyContent();

          this.existingLeftImage = '';
          this.existingRightImage = '';

          this.leftImageFile = null;
          this.rightImageFile = null;
          this.clearImagePreview();

          this.successMessage = 'Chronicles of Thread deleted successfully.';
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Unable to delete Chronicles of Thread.';
        },
      });
  }

  resetForm(): void {
    if (
      !window.confirm(
        'Are you sure you want to reset the form? Unsaved changes will be lost.'
      )
    ) {
      return;
    }

    this.content = this.getEmptyContent();
    this.leftImageFile = null;
    this.rightImageFile = null;
    this.clearImagePreview();

    if (this.hasContent) {
      this.getChronicles();
    }

    this.errorMessage = '';
    this.successMessage = '';
  }

  private revokeUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private clearImagePreview(): void {
    this.revokeUrl(this.leftImagePreview);
    this.revokeUrl(this.rightImagePreview);

    this.leftImagePreview = '';
    this.rightImagePreview = '';
  }
}
