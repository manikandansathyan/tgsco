import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface GovernmentScheme {
  title: string;
  slug: string;
  category: string;
  description: string;

  whoCanApply: {
    heading: string;
    items: string[];
  };

  schemeBenefits: {
    heading: string;
    intro: string;
    contributionPlans: {
      monthlyContribution: string;
      purchaseValue: string;
    }[];
    instalmentBenefits: string[];
  };

  howToApply: {
    heading: string;
    steps: string[];
  };

  documentsRequired: {
    heading: string;
    items: string[];
  };

  membershipBenefits: {
    heading: string;
    items: string[];
  };

  detailImageField: string;
  detailImageAlt: string;
  detailImageUrl: string | null;
  detailImageFile: File | null;
  detailImagePreview: string | null;
}

@Component({
  selector: 'app-govt-schemes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './govt-schemes.html',
  styleUrl: './govt-schemes.css',
})
export class GovtSchemes implements OnInit, OnDestroy {
  pageTitle = 'Current Government Schemes';
  imageAlt = 'Hands working with green handloom yarn';

  schemeImage: File | null = null;
  schemeImagePreview: string | null = null;
  existingSchemeImage: string | null = null;

  schemes: GovernmentScheme[] = [];

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCurrentSchemes();
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  private defaultScheme(): GovernmentScheme {
    return {
      title: '',
      slug: '',
      category: 'Scheme',
      description: '',

      whoCanApply: {
        heading: 'Who Can Apply',
        items: [''],
      },

      schemeBenefits: {
        heading: 'Scheme Benefits',
        intro: '',
        contributionPlans: [
          {
            monthlyContribution: '',
            purchaseValue: '',
          },
        ],
        instalmentBenefits: [''],
      },

      howToApply: {
        heading: 'How to Apply',
        steps: [''],
      },

      documentsRequired: {
        heading: 'Documents Required',
        items: [''],
      },

      membershipBenefits: {
        heading: '',
        items: [''],
      },

      detailImageField: '',
      detailImageAlt: '',
      detailImageUrl: null,
      detailImageFile: null,
      detailImagePreview: null,
    };
  }

  loadCurrentSchemes(): void {
    this.isLoading = true;
    this.message = '';

    this.api
      .getCurrentSchemes()
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
          const content = data?.content ?? data;

          if (!content || typeof content !== 'object') {
            this.isEditing = false;
            this.schemes = [];
            return;
          }

          this.pageTitle =
            content.title ?? 'Current Government Schemes';

          const images = Array.isArray(data?.images)
            ? data.images
            : [];

          this.existingSchemeImage =
            images.find(
              (image: any) => image.field === 'schemeImage'
            )?.url ??
            this.extractImageUrl(content.schemeImage) ??
            this.extractImageUrl(content.imageUrl) ??
            this.extractImageUrl(content.image);

          const incomingSchemes = Array.isArray(content.schemes)
            ? content.schemes
            : [];

          this.clearDetailPreviews();

          this.schemes = incomingSchemes.map(
            (item: any, index: number) => {
              const defaults = this.defaultScheme();

              const imageField =
                item.imageField || `schemes[${index}].image`;

              const matchedImage = images.find(
                (image: any) => image.field === imageField
              );

              return {
                ...defaults,
                ...item,

                whoCanApply: {
                  ...defaults.whoCanApply,
                  ...(item.whoCanApply ?? {}),
                  items: Array.isArray(item.whoCanApply?.items)
                    ? [...item.whoCanApply.items]
                    : [''],
                },

                schemeBenefits: {
                  ...defaults.schemeBenefits,
                  ...(item.schemeBenefits ?? {}),

                  contributionPlans: Array.isArray(
                    item.schemeBenefits?.contributionPlans
                  )
                    ? item.schemeBenefits.contributionPlans.map(
                        (plan: any) => ({
                          monthlyContribution:
                            plan.monthlyContribution ?? '',
                          purchaseValue: plan.purchaseValue ?? '',
                        })
                      )
                    : [
                        {
                          monthlyContribution: '',
                          purchaseValue: '',
                        },
                      ],

                  instalmentBenefits: Array.isArray(
                    item.schemeBenefits?.instalmentBenefits
                  )
                    ? [...item.schemeBenefits.instalmentBenefits]
                    : [''],
                },

                howToApply: {
                  ...defaults.howToApply,
                  ...(item.howToApply ?? {}),
                  steps: Array.isArray(item.howToApply?.steps)
                    ? [...item.howToApply.steps]
                    : [''],
                },

                documentsRequired: {
                  ...defaults.documentsRequired,
                  ...(item.documentsRequired ?? {}),
                  items: Array.isArray(
                    item.documentsRequired?.items
                  )
                    ? [...item.documentsRequired.items]
                    : [''],
                },

                membershipBenefits: {
                  ...defaults.membershipBenefits,
                  ...(item.membershipBenefits ?? {}),
                  items: Array.isArray(
                    item.membershipBenefits?.items
                  )
                    ? [...item.membershipBenefits.items]
                    : [''],
                },

                detailImageField: imageField,
                detailImageAlt: item.imageAlt ?? '',

                detailImageUrl:
                  matchedImage?.url ??
                  this.extractImageUrl(item.detailImage) ??
                  this.extractImageUrl(item.detailImageUrl),

                detailImageFile: null,
                detailImagePreview: null,
              };
            }
          );

          this.isEditing = !!(
            data?.id ||
            data?._id ||
            this.schemes.length
          );

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error(
            'Failed to load government schemes:',
            error
          );

          this.showMessage(
            'Unable to load existing schemes. You can still create content.',
            'error'
          );
        },
      });
  }

  addScheme(): void {
    this.schemes.push(this.defaultScheme());
    this.cdr.markForCheck();
  }

  removeScheme(index: number): void {
    const scheme = this.schemes[index];

    if (scheme?.detailImagePreview) {
      URL.revokeObjectURL(scheme.detailImagePreview);
    }

    this.schemes.splice(index, 1);
    this.cdr.markForCheck();
  }

  addArrayItem(items: string[]): void {
    items.push('');
  }

  removeArrayItem(items: string[], index: number): void {
    items.splice(index, 1);

    if (items.length === 0) {
      items.push('');
    }
  }

  addContributionPlan(scheme: GovernmentScheme): void {
    scheme.schemeBenefits.contributionPlans.push({
      monthlyContribution: '',
      purchaseValue: '',
    });
  }

  removeContributionPlan(
    scheme: GovernmentScheme,
    index: number
  ): void {
    scheme.schemeBenefits.contributionPlans.splice(index, 1);

    if (scheme.schemeBenefits.contributionPlans.length === 0) {
      scheme.schemeBenefits.contributionPlans.push({
        monthlyContribution: '',
        purchaseValue: '',
      });
    }
  }

  onMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!this.validateImage(file, input)) return;

    this.schemeImage = file;

    if (this.schemeImagePreview) {
      URL.revokeObjectURL(this.schemeImagePreview);
    }

    this.schemeImagePreview = URL.createObjectURL(file);
    this.message = '';
  }

  onDetailImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!this.validateImage(file, input)) return;

    const scheme = this.schemes[index];

    if (scheme.detailImagePreview) {
      URL.revokeObjectURL(scheme.detailImagePreview);
    }

    scheme.detailImageFile = file;
    scheme.detailImagePreview = URL.createObjectURL(file);
    this.message = '';
  }

  private validateImage(
    file: File,
    input: HTMLInputElement
  ): boolean {
    if (!file.type.startsWith('image/')) {
      this.showMessage(
        'Please select a valid image file.',
        'error'
      );
      input.value = '';
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage(
        'Image size must be 5 MB or less.',
        'error'
      );
      input.value = '';
      return false;
    }

    return true;
  }

  saveCurrentSchemes(): void {
    if (!this.pageTitle.trim()) {
      this.showMessage(
        'Please enter the page title.',
        'error'
      );
      return;
    }

    if (!this.schemes.length) {
      this.showMessage(
        'Add at least one scheme before saving.',
        'error'
      );
      return;
    }

    for (let index = 0; index < this.schemes.length; index++) {
      const scheme = this.schemes[index];

      if (!scheme.title.trim() || !scheme.slug.trim()) {
        this.showMessage(
          `Enter a title and slug for scheme ${index + 1}.`,
          'error'
        );
        return;
      }
    }

    const detailImages: Record<string, File> = {};

    const content = {
      title: this.pageTitle.trim(),

      schemes: this.schemes.map((scheme, index) => {
        // Image field names must match the scheme's current array index.
        const imageField = `schemes[${index}].image`;

        if (scheme.detailImageFile) {
          detailImages[imageField] = scheme.detailImageFile;
        }

        return {
          title: scheme.title.trim(),
          slug: scheme.slug.trim(),
          category: scheme.category,
          description: scheme.description,

          imageField,
          imageAlt: scheme.detailImageAlt,

          whoCanApply: scheme.whoCanApply,
          schemeBenefits: scheme.schemeBenefits,
          howToApply: scheme.howToApply,
          documentsRequired: scheme.documentsRequired,

          ...(scheme.membershipBenefits.heading.trim() ||
          scheme.membershipBenefits.items.some(
            (item) => item.trim()
          )
            ? {
                membershipBenefits: {
                  heading: scheme.membershipBenefits.heading,
                  items: scheme.membershipBenefits.items,
                },
              }
            : {}),
        };
      }),
    };

    this.isSaving = true;
    this.message = '';

    const request = this.isEditing
      ? this.api.updateCurrentSchemes(
          content,
          this.schemeImage ?? undefined,
          detailImages
        )
      : this.api.createCurrentSchemes(
          content,
          this.schemeImage ?? undefined,
          detailImages
        );

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
          if (
            response?.success === false ||
            response?.error
          ) {
            this.showMessage(
              response?.message ??
                'Unable to save government schemes.',
              'error'
            );
            return;
          }

          this.showMessage(
            this.isEditing
              ? 'Government schemes updated successfully.'
              : 'Government schemes created successfully.',
            'success'
          );

          this.schemeImage = null;

          if (this.schemeImagePreview) {
            URL.revokeObjectURL(this.schemeImagePreview);
            this.schemeImagePreview = null;
          }

          this.loadCurrentSchemes();
        },

        error: (error) => {
          console.error(
            'Failed to save government schemes:',
            error
          );

          this.showMessage(
            error?.error?.message ??
              'Failed to save government schemes.',
            'error'
          );
        },
      });
  }

  deleteCurrentSchemes(): void {
    if (!this.isEditing) {
      this.showMessage(
        'There is no saved content to delete.',
        'error'
      );
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete all Current Government Schemes content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.message = '';

    this.api
      .deleteCurrentSchemes()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (
            response?.success === false ||
            response?.error
          ) {
            this.showMessage(
              response?.message ??
                'Unable to delete government schemes.',
              'error'
            );
            return;
          }

          this.pageTitle = 'Current Government Schemes';
          this.imageAlt =
            'Hands working with green handloom yarn';

          this.existingSchemeImage = null;
          this.schemeImage = null;
          this.schemes = [];
          this.isEditing = false;

          this.clearPreviews();

          this.showMessage(
            'Government schemes content deleted successfully.',
            'success'
          );
        },

        error: (error) => {
          console.error(
            'Failed to delete government schemes:',
            error
          );

          this.showMessage(
            error?.error?.message ??
              'Failed to delete government schemes.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.schemeImage = null;
    this.clearPreviews();
    this.message = '';
    this.loadCurrentSchemes();
  }

  private extractImageUrl(value: any): string | null {
    if (typeof value === 'string') {
      return value || null;
    }

    if (value && typeof value === 'object') {
      return (
        value.url ??
        value.secure_url ??
        value.src ??
        null
      );
    }

    return null;
  }

  private clearDetailPreviews(): void {
    for (const scheme of this.schemes) {
      if (scheme.detailImagePreview) {
        URL.revokeObjectURL(scheme.detailImagePreview);
      }
    }
  }

  private clearPreviews(): void {
    if (this.schemeImagePreview) {
      URL.revokeObjectURL(this.schemeImagePreview);
      this.schemeImagePreview = null;
    }

    this.clearDetailPreviews();

    for (const scheme of this.schemes) {
      scheme.detailImagePreview = null;
      scheme.detailImageFile = null;
    }
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message = message;
    this.messageType = type;
    this.cdr.markForCheck();
  }
}