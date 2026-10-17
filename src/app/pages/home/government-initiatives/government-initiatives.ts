
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface GovernmentInitiativesContent {
  title: string;
  description: string;
  initiatives: string[];
  button: {
    label: string;
    url: string;
  };
}

@Component({
  selector: 'app-government-initiatives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './government-initiatives.html',
  styleUrl: './government-initiatives.css',
})
export class GovernmentInitiatives implements OnInit {
  private readonly api = inject(Api);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  initiativeImageFile: File | null = null;
  initiativeImageUrl = '';

  content: GovernmentInitiativesContent = this.getDefaultContent();

  ngOnInit(): void {
    this.loadGovernmentInitiatives();
  }

  private getDefaultContent(): GovernmentInitiativesContent {
    return {
      title: "Backing the Backbone of Telangana's Textile Story",
      description:
        'Through close integration with State and Central Welfare schemes, TGSCO provides active healthcare coverage, thrift-fund savings assistance, yarn subsidies, and modern skill-development workshops to thousands of independent artisans, turning handloom into a sustainable lifestyle.',
      initiatives: [
        'Chenetha Mithra (Yarn Subsidy Scheme)',
        'Nethanna Bima (Weaver Insurance Scheme)',
        'National Handloom Development Programme Partner',
      ],
      button: {
        label: 'Explore Schemes',
        url: '/initiatives',
      },
    };
  }

  loadGovernmentInitiatives(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getGovernmentInitiativesAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          const savedContent = data?.content ?? data;

          if (
            savedContent &&
            typeof savedContent === 'object' &&
            typeof savedContent.title === 'string'
          ) {
            const defaults = this.getDefaultContent();

            this.content = {
              title: savedContent.title ?? defaults.title,
              description:
                savedContent.description ?? defaults.description,
              initiatives: Array.isArray(savedContent.initiatives)
                ? [...savedContent.initiatives]
                : [...defaults.initiatives],
              button: {
                label:
                  savedContent.button?.label ?? defaults.button.label,
                url: savedContent.button?.url ?? defaults.button.url,
              },
            };

            this.initiativeImageUrl = this.getImageUrl(
              savedContent.initiativeImageUrl ??
                savedContent.initiativeImage ??
                savedContent.initiative_image ??
                data?.initiativeImageUrl ??
                data?.initiativeImage
            );

            this.initiativeImageFile = null;
            this.isExistingContent = true;
          } else {
            this.content = this.getDefaultContent();
            this.initiativeImageUrl = '';
            this.initiativeImageFile = null;
            this.isExistingContent = false;
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error(
            'Failed to load Government Initiatives:',
            error
          );

          this.content = this.getDefaultContent();
          this.isExistingContent = false;
          this.errorMessage =
            'Could not load saved content. Check the API response before creating new content.';
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

  addInitiative(): void {
    this.content.initiatives.push('');
  }

  removeInitiative(index: number): void {
    if (this.content.initiatives.length <= 1) {
      this.errorMessage = 'At least one initiative is required.';
      return;
    }

    this.content.initiatives.splice(index, 1);
    this.errorMessage = '';
  }

  onInitiativeImageSelected(event: Event): void {
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
    this.initiativeImageFile = file;
    this.initiativeImageUrl = URL.createObjectURL(file);
    this.cdr.markForCheck();
  }

  saveGovernmentInitiatives(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.content.title.trim()) {
      this.errorMessage = 'Please enter a title.';
      return;
    }

    if (!this.content.description.trim()) {
      this.errorMessage = 'Please enter a description.';
      return;
    }

    if (
      this.content.initiatives.some(
        (initiative) => !initiative.trim()
      )
    ) {
      this.errorMessage =
        'Please fill in every initiative or remove empty entries.';
      return;
    }

    if (!this.content.button.label.trim()) {
      this.errorMessage = 'Please enter the button label.';
      return;
    }

    if (!this.content.button.url.trim()) {
      this.errorMessage = 'Please enter the button URL.';
      return;
    }

    const payload: GovernmentInitiativesContent = {
      title: this.content.title.trim(),
      description: this.content.description.trim(),
      initiatives: this.content.initiatives.map((initiative) =>
        initiative.trim()
      ),
      button: {
        label: this.content.button.label.trim(),
        url: this.content.button.url.trim(),
      },
    };

    this.isSaving = true;

    const request$ = this.isExistingContent
      ? this.api.updateGovernmentInitiativesAPI(
          payload,
          this.initiativeImageFile
        )
      : this.api.addGovernmentInitiativesAPI(
          payload,
          this.initiativeImageFile
        );

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
            'Government Initiatives saved successfully.';

          this.initiativeImageFile = null;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error(
            'Failed to save Government Initiatives:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to save Government Initiatives. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  deleteGovernmentInitiatives(): void {
    if (!this.isExistingContent) {
      return;
    }

    if (
      !confirm(
        'Are you sure you want to delete Government Initiatives content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api
      .deleteGovernmentInitiativesAPI()
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
          this.initiativeImageUrl = '';
          this.initiativeImageFile = null;
          this.isExistingContent = false;
          this.successMessage =
            'Government Initiatives deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error(
            'Failed to delete Government Initiatives:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to delete Government Initiatives. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }
}
