
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

interface ContributionPlan {
  monthlyContribution: string;
  purchaseValue: string;
}

interface SchemeSection {
  heading: string;
  items: string[];
}

interface GovernmentScheme {
  title: string;
  slug: string;
  category: string;
  description: string;
  imageField: string;
  imageAlt: string;
  imageUrl: string;
  imageFile: File | null;

  whoCanApply?: SchemeSection;

  schemeBenefits?: {
    heading: string;
    intro: string;
    contributionPlans: ContributionPlan[];
    instalmentBenefits: string[];
  };

  howToApply?: {
    heading: string;
    steps: string[];
  };

  documentsRequired?: SchemeSection;

  membershipBenefits?: SchemeSection;
}

interface GovernmentInitiativesContent {
  title: string;
  schemes: GovernmentScheme[];
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

  content: GovernmentInitiativesContent = this.getDefaultContent();

  ngOnInit(): void {
    this.loadGovernmentInitiatives();
  }

  private getDefaultContent(): GovernmentInitiativesContent {
    return {
      title: 'Current Government Schemes',
      schemes: [],
    };
  }

  private getDefaultScheme(): GovernmentScheme {
    return {
      title: '',
      slug: '',
      category: 'Scheme',
      description: '',
      imageField: '',
      imageAlt: '',
      imageUrl: '',
      imageFile: null,

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
        heading: 'Membership Benefits',
        items: [''],
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
            const returnedImages: any[] = Array.isArray(data?.images)
              ? data.images
              : [];

            const savedSchemes: any[] = Array.isArray(
              savedContent.schemes
            )
              ? savedContent.schemes
              : [];

            this.content = {
              title: savedContent.title,
              schemes: savedSchemes.map(
                (scheme: any, index: number) => {
                  const imageField =
                    scheme.imageField || `schemes[${index}].image`;

                  const matchedImage = returnedImages.find(
                    (image: any) => image.field === imageField
                  );

                  return {
                    title: scheme.title ?? '',
                    slug: scheme.slug ?? '',
                    category: scheme.category ?? 'Scheme',
                    description: scheme.description ?? '',
                    imageField,
                    imageAlt: scheme.imageAlt ?? '',
                    imageUrl:
                      matchedImage?.url ??
                      this.getImageUrl(
                        scheme.imageUrl ?? scheme.image
                      ),
                    imageFile: null,

                    whoCanApply: scheme.whoCanApply
                      ? {
                          heading:
                            scheme.whoCanApply.heading ?? '',
                          items: Array.isArray(
                            scheme.whoCanApply.items
                          )
                            ? [...scheme.whoCanApply.items]
                            : [],
                        }
                      : undefined,

                    schemeBenefits: scheme.schemeBenefits
                      ? {
                          heading:
                            scheme.schemeBenefits.heading ?? '',
                          intro:
                            scheme.schemeBenefits.intro ?? '',
                          contributionPlans: Array.isArray(
                            scheme.schemeBenefits.contributionPlans
                          )
                            ? scheme.schemeBenefits.contributionPlans.map(
                                (plan: any) => ({
                                  monthlyContribution:
                                    plan.monthlyContribution ?? '',
                                  purchaseValue:
                                    plan.purchaseValue ?? '',
                                })
                              )
                            : [],
                          instalmentBenefits: Array.isArray(
                            scheme.schemeBenefits.instalmentBenefits
                          )
                            ? [...scheme.schemeBenefits.instalmentBenefits]
                            : [],
                        }
                      : undefined,

                    howToApply: scheme.howToApply
                      ? {
                          heading:
                            scheme.howToApply.heading ?? '',
                          steps: Array.isArray(
                            scheme.howToApply.steps
                          )
                            ? [...scheme.howToApply.steps]
                            : [],
                        }
                      : undefined,

                    documentsRequired: scheme.documentsRequired
                      ? {
                          heading:
                            scheme.documentsRequired.heading ?? '',
                          items: Array.isArray(
                            scheme.documentsRequired.items
                          )
                            ? [...scheme.documentsRequired.items]
                            : [],
                        }
                      : undefined,

                    membershipBenefits: scheme.membershipBenefits
                      ? {
                          heading:
                            scheme.membershipBenefits.heading ?? '',
                          items: Array.isArray(
                            scheme.membershipBenefits.items
                          )
                            ? [...scheme.membershipBenefits.items]
                            : [],
                        }
                      : undefined,
                  };
                }
              ),
            };

            this.isExistingContent = !!data?.id;
          } else {
            this.content = this.getDefaultContent();
            this.isExistingContent = false;
          }

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error(
            'Failed to load Government Schemes:',
            error
          );

          this.content = this.getDefaultContent();
          this.isExistingContent = false;

          this.errorMessage =
            'Could not load saved government schemes. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  private getImageUrl(image: any): string {
    if (typeof image === 'string') {
      return image;
    }

    if (image && typeof image === 'object') {
      return (
        image.url ??
        image.secure_url ??
        image.path ??
        ''
      );
    }

    return '';
  }

  addScheme(): void {
    this.content.schemes.push(this.getDefaultScheme());
    this.errorMessage = '';
  }

  removeScheme(index: number): void {
    if (!confirm('Are you sure you want to remove this scheme?')) {
      return;
    }

    this.content.schemes.splice(index, 1);
    this.errorMessage = '';
  }

  onSchemeImageSelected(event: Event, index: number): void {
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

    const scheme = this.content.schemes[index];

    if (scheme.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(scheme.imageUrl);
    }

    scheme.imageFile = file;
    scheme.imageUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  addStringItem(items: string[]): void {
    items.push('');
  }

  removeStringItem(items: string[], index: number): void {
    if (items.length <= 1) {
      this.errorMessage = 'At least one item is required.';
      return;
    }

    items.splice(index, 1);
    this.errorMessage = '';
  }

  addContributionPlan(scheme: GovernmentScheme): void {
    if (!scheme.schemeBenefits) {
      return;
    }

    scheme.schemeBenefits.contributionPlans.push({
      monthlyContribution: '',
      purchaseValue: '',
    });
  }

  removeContributionPlan(
    scheme: GovernmentScheme,
    index: number
  ): void {
    const plans = scheme.schemeBenefits?.contributionPlans;

    if (!plans || plans.length <= 1) {
      this.errorMessage = 'At least one contribution plan is required.';
      return;
    }

    plans.splice(index, 1);
    this.errorMessage = '';
  }

  createSlug(scheme: GovernmentScheme): void {
    scheme.slug = scheme.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  saveGovernmentInitiatives(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.content.title.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.content.schemes.length === 0) {
      this.errorMessage = 'Please add at least one scheme.';
      return;
    }

    for (let i = 0; i < this.content.schemes.length; i++) {
      const scheme = this.content.schemes[i];

      if (!scheme.title.trim()) {
        this.errorMessage = `Please enter the title for Scheme ${i + 1}.`;
        return;
      }

      if (!scheme.slug.trim()) {
        this.errorMessage = `Please enter the slug for Scheme ${i + 1}.`;
        return;
      }

      if (!scheme.description.trim()) {
        this.errorMessage = `Please enter the description for Scheme ${i + 1}.`;
        return;
      }
    }

    const payload = {
      title: this.content.title.trim(),
      schemes: this.content.schemes.map((scheme) => {
        const savedScheme: any = {
          title: scheme.title.trim(),
          slug: scheme.slug.trim(),
          category: scheme.category.trim(),
          description: scheme.description.trim(),
          imageField: scheme.imageField,
          imageAlt: scheme.imageAlt.trim(),
        };

        if (scheme.whoCanApply) {
          savedScheme.whoCanApply = {
            heading: scheme.whoCanApply.heading,
            items: scheme.whoCanApply.items.filter(
              (item) => item.trim()
            ),
          };
        }

        if (scheme.schemeBenefits) {
          savedScheme.schemeBenefits = {
            heading: scheme.schemeBenefits.heading,
            intro: scheme.schemeBenefits.intro,
            contributionPlans:
              scheme.schemeBenefits.contributionPlans,
            instalmentBenefits:
              scheme.schemeBenefits.instalmentBenefits.filter(
                (item) => item.trim()
              ),
          };
        }

        if (scheme.howToApply) {
          savedScheme.howToApply = {
            heading: scheme.howToApply.heading,
            steps: scheme.howToApply.steps.filter(
              (step) => step.trim()
            ),
          };
        }

        if (scheme.documentsRequired) {
          savedScheme.documentsRequired = {
            heading: scheme.documentsRequired.heading,
            items: scheme.documentsRequired.items.filter(
              (item) => item.trim()
            ),
          };
        }

        if (scheme.membershipBenefits) {
          savedScheme.membershipBenefits = {
            heading: scheme.membershipBenefits.heading,
            items: scheme.membershipBenefits.items.filter(
              (item) => item.trim()
            ),
          };
        }

        return savedScheme;
      }),
    };

    const formData = new FormData();

    formData.append('content', JSON.stringify(payload));

    this.content.schemes.forEach((scheme, index) => {
      if (scheme.imageFile) {
        formData.append(
          `schemes[${index}].image`,
          scheme.imageFile
        );
      }
    });

    this.isSaving = true;

    const request$ = this.isExistingContent
      ? this.api.updateGovernmentInitiativesAPI(formData)
      : this.api.addGovernmentInitiativesAPI(formData);

    request$
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
          this.successMessage =
            response?.message ??
            'Government schemes saved successfully.';

          this.loadGovernmentInitiatives();
          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error(
            'Failed to save Government Schemes:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to save government schemes. Please try again.';

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
        'Are you sure you want to delete all government schemes?'
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
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.content = this.getDefaultContent();
          this.isExistingContent = false;

          this.successMessage =
            'Government schemes deleted successfully.';

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error(
            'Failed to delete Government Schemes:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to delete government schemes. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }
}
