import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-contact-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-hero.html',
  styleUrl: './contact-hero.css',
})
export class ContactHero implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions = new Subscription();

  title = 'CONTACT';
  breadcrumb = 'Home / Contact us';
  intro =
    'For any enquiries, or just to say hello, get in touch and contact us.';

  phoneLabel = 'PHONE';
  phoneValue = '+91 40 2323 XXXX';
  phoneIcon = 'phone';

  emailLabel = 'EMAIL';
  emailValue = 'info@tgsco.telangana.gov.in';
  emailIcon = 'email';

  addressLabel = 'OFFICE ADDRESS';
  addressValue = 'Regional Office, Warangal, Telangana 506002';
  addressIcon = 'location';

  imageAlt = 'Handloom loom with woven textile';
  imageUrl = '';
  selectedImage: File | null = null;
  previewUrl = '';

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditMode = false;

  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadContactHero();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearPreview();
  }

  private clearPreview(): void {
    if (this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  private extractPayload(response: any): any {
    const data = response?.data ?? response ?? {};

    let content = data.content ?? {};

    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = {};
      }
    }

    if (!content || typeof content !== 'object') {
      content = {};
    }

    return {
      ...data,
      ...content,
      images: Array.isArray(data.images)
        ? data.images
        : Array.isArray(content.images)
          ? content.images
          : [],
    };
  }

  private extractImageUrl(data: any): string {
    const images = Array.isArray(data?.images)
      ? data.images
      : [];

    const imageField = data?.imageField ?? 'heroImage';

    const matchingImage = images.find(
      (image: any) => image.field === imageField
    );

    if (matchingImage?.url) {
      return matchingImage.url;
    }

    // Fallback for older API response formats.
    const value =
      data?.heroImageUrl ??
      data?.heroImage ??
      data?.image;

    if (typeof value === 'string') {
      return value;
    }

    if (!value || typeof value !== 'object') {
      return '';
    }

    for (const key of [
      'url',
      'imageUrl',
      'image_url',
      'heroImage',
      'image',
      'src',
    ]) {
      const candidate = value[key];

      if (typeof candidate === 'string') {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const nested = this.extractImageUrl({
          images: [],
          heroImageUrl: candidate,
        });

        if (nested) {
          return nested;
        }
      }
    }

    return '';
  }

  loadContactHero(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api
        .getContactHero()
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (response: any) => {
            const data = this.extractPayload(response);

            this.title = data?.title ?? 'CONTACT';

            this.breadcrumb =
              data?.breadcrumb ?? 'Home / Contact us';

            this.intro =
              data?.intro ??
              'For any enquiries, or just to say hello, get in touch and contact us.';

            const details = data?.contactDetails ?? {};

            this.phoneLabel =
              details?.phone?.label ?? 'PHONE';

            this.phoneValue =
              details?.phone?.value ?? '+91 40 2323 XXXX';

            this.phoneIcon =
              details?.phone?.icon ?? 'phone';

            this.emailLabel =
              details?.email?.label ?? 'EMAIL';

            this.emailValue =
              details?.email?.value ??
              'info@tgsco.telangana.gov.in';

            this.emailIcon =
              details?.email?.icon ?? 'email';

            this.addressLabel =
              details?.officeAddress?.label ?? 'OFFICE ADDRESS';

            this.addressValue =
              details?.officeAddress?.value ??
              'Regional Office, Warangal, Telangana 506002';

            this.addressIcon =
              details?.officeAddress?.icon ?? 'location';

            this.imageAlt =
              data?.imageAlt ??
              'Handloom loom with woven textile';

            const image = this.extractImageUrl(data);

            this.clearPreview();

            this.imageUrl = image;
            this.previewUrl = image;
            this.selectedImage = null;

            this.isEditMode =
              !!data?.id ||
              !!data?.title ||
              !!data?.imageField;

            this.cdr.markForCheck();
          },

          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ??
              'Unable to load Contact Hero content.';
          },
        })
    );
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

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage =
        'The image size must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.clearPreview();

    this.selectedImage = file;
    this.previewUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();
  }

  saveContactHero(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.title.trim() ||
      !this.breadcrumb.trim() ||
      !this.intro.trim()
    ) {
      this.errorMessage =
        'Please complete the title, breadcrumb, and intro.';
      return;
    }

    if (
      !this.phoneValue.trim() ||
      !this.emailValue.trim() ||
      !this.addressValue.trim()
    ) {
      this.errorMessage =
        'Please complete all contact details.';
      return;
    }

    if (!this.selectedImage && !this.imageUrl) {
      this.errorMessage = 'Please select a hero image.';
      return;
    }

    const content = {
      title: this.title.trim(),
      breadcrumb: this.breadcrumb.trim(),
      intro: this.intro.trim(),

      contactDetails: {
        phone: {
          label: this.phoneLabel.trim(),
          value: this.phoneValue.trim(),
          icon: this.phoneIcon.trim() || 'phone',
        },

        email: {
          label: this.emailLabel.trim(),
          value: this.emailValue.trim(),
          icon: this.emailIcon.trim() || 'email',
        },

        officeAddress: {
          label: this.addressLabel.trim(),
          value: this.addressValue.trim(),
          icon: this.addressIcon.trim() || 'location',
        },
      },

      imageField: 'heroImage',
      imageAlt:
        this.imageAlt.trim() || this.title.trim(),
    };

    this.isSaving = true;

    const request = this.isEditMode
      ? this.api.updateContactHero(
          content,
          this.selectedImage ?? undefined
        )
      : this.api.createContactHero(
          content,
          this.selectedImage ?? undefined
        );

    this.subscriptions.add(
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
          next: () => {
            this.successMessage = this.isEditMode
              ? 'Contact Hero updated successfully.'
              : 'Contact Hero created successfully.';

            this.loadContactHero();
          },

          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ??
              'Unable to save Contact Hero content.';
          },
        })
    );
  }

  deleteContactHero(): void {
    if (
      !confirm(
        'Are you sure you want to delete the Contact Hero content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api
        .deleteContactHero()
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
            this.clearPreview();

            this.title = 'CONTACT';
            this.breadcrumb = 'Home / Contact us';

            this.intro =
              'For any enquiries, or just to say hello, get in touch and contact us.';

            this.phoneLabel = 'PHONE';
            this.phoneValue = '+91 40 2323 XXXX';
            this.phoneIcon = 'phone';

            this.emailLabel = 'EMAIL';
            this.emailValue =
              'info@tgsco.telangana.gov.in';
            this.emailIcon = 'email';

            this.addressLabel = 'OFFICE ADDRESS';
            this.addressValue =
              'Regional Office, Warangal, Telangana 506002';
            this.addressIcon = 'location';

            this.imageAlt =
              'Handloom loom with woven textile';

            this.imageUrl = '';
            this.previewUrl = '';
            this.selectedImage = null;

            this.isEditMode = false;

            this.successMessage =
              'Contact Hero deleted successfully.';

            this.cdr.markForCheck();
          },

          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ??
              'Unable to delete Contact Hero content.';
          },
        })
    );
  }

  resetForm(): void {
    if (
      confirm(
        'Discard unsaved changes and reload the content?'
      )
    ) {
      this.loadContactHero();
    }
  }
}
