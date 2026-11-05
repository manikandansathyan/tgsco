
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

interface CalendarEvent {
  id: string;
  slug: string;
  day: string;
  date: string;
  title: string;
  description: string;
  imageAlt: string;
  imageFile: File | null;
  imagePreview: string;
  existingImageUrl: string;
}

@Component({
  selector: 'app-calender',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calender.html',
  styleUrl: './calender.css',
})
export class Calender implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  sectionTitle = 'Events Calendar';
  items: CalendarEvent[] = [];

  calendarIconFile: File | null = null;
  calendarIconPreview = '';
  existingCalendarIconUrl = '';

  loading = false;
  saving = false;
  deleting = false;
  isEditMode = false;

  message = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadEventsCalendar();
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  private parseContent(value: any): any {
    if (typeof value !== 'string') return value ?? {};

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  private extractData(response: any): any {
    const data = response?.data ?? response ?? {};
    const content = this.parseContent(data.content);

    return {
      ...data,
      ...content,
      images: data.images ?? content.images ?? [],
    };
  }

  private extractImageUrl(
    value: any,
    images: any[],
    field: string
  ): string {
    // Find image URL from the API's sibling images array.
    const matchingImage = images.find(
      (image: any) => image.field === field
    );

    if (matchingImage?.url) {
      return matchingImage.url;
    }

    // Fallback for older API response formats.
    const image =
      value?.imageUrl ??
      value?.imageURL ??
      value?.image_url ??
      value?.image ??
      value?.url ??
      '';

    if (typeof image === 'string') return image;

    return (
      image?.url ??
      image?.imageUrl ??
      image?.secure_url ??
      image?.path ??
      ''
    );
  }

  private createEmptyItem(index: number): CalendarEvent {
    return {
      id: `event-${index + 1}`,
      slug: `event-${index + 1}`,
      day: '',
      date: '',
      title: 'EVENT',
      description: '',
      imageAlt: '',
      imageFile: null,
      imagePreview: '',
      existingImageUrl: '',
    };
  }

  loadEventsCalendar(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .getEventsCalendar()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = this.extractData(response);

          const images = Array.isArray(data.images)
            ? data.images
            : [];

          this.clearPreviews();

          this.sectionTitle = data.title ?? 'Events Calendar';

          this.items = Array.isArray(data.items)
            ? data.items.map((item: any, index: number) => {
                const fallbackId = `event-${index + 1}`;
                const imageField =
                  item.imageField ?? `items[${index}].image`;

                return {
                  id: item.id ?? fallbackId,
                  slug: item.slug ?? item.id ?? fallbackId,
                  day: item.day ?? '',
                  date: item.date ?? '',
                  title: item.title ?? 'EVENT',
                  description: item.description ?? '',
                  imageAlt: item.imageAlt ?? '',
                  imageFile: null,
                  imagePreview: '',
                  existingImageUrl: this.extractImageUrl(
                    item,
                    images,
                    imageField
                  ),
                };
              })
            : [];

          // Calendar icon is stored separately in data.images[].
          this.existingCalendarIconUrl = this.extractImageUrl(
            {
              image:
                data.calendarIconUrl ??
                data.calendarIcon ??
                data.calendar_icon ??
                data.icon,
            },
            images,
            data.calendarIconField ?? 'calendarIcon'
          );

          this.calendarIconFile = null;
          this.calendarIconPreview = '';

          this.isEditMode =
            !!data.title || this.items.length > 0;

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          if (error.status === 404) {
            this.isEditMode = false;
            this.items = [];
            this.existingCalendarIconUrl = '';

            this.message =
              'No Events Calendar section found. You can create it below.';
            return;
          }

          this.errorMessage =
            error?.error?.message ?? 'Failed to load Events Calendar.';
        },
      });
  }

  addItem(): void {
    this.items.push(this.createEmptyItem(this.items.length));
  }

  removeItem(index: number): void {
    this.revokeUrl(this.items[index]?.imagePreview);
    this.items.splice(index, 1);
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Each image must be less than 5 MB.';
      input.value = '';
      return;
    }

    this.errorMessage = '';

    const item = this.items[index];

    this.revokeUrl(item.imagePreview);

    item.imageFile = file;
    item.imagePreview = URL.createObjectURL(file);
  }

  onCalendarIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid calendar icon image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'The calendar icon must be less than 5 MB.';
      input.value = '';
      return;
    }

    this.errorMessage = '';

    this.revokeUrl(this.calendarIconPreview);

    this.calendarIconFile = file;
    this.calendarIconPreview = URL.createObjectURL(file);
  }

  private makeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  saveEventsCalendar(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.sectionTitle.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Please add at least one calendar event.';
      return;
    }

    for (let index = 0; index < this.items.length; index++) {
      const item = this.items[index];

      if (!item.day.trim() || !item.date.trim()) {
        this.errorMessage =
          `Please enter the day and date for event ${index + 1}.`;
        return;
      }

      if (!item.title.trim()) {
        this.errorMessage =
          `Please enter a title for event ${index + 1}.`;
        return;
      }

      if (!item.description.trim()) {
        this.errorMessage =
          `Please enter a description for event ${index + 1}.`;
        return;
      }

      if (!item.imageFile && !item.existingImageUrl) {
        this.errorMessage =
          `Please upload an image for event ${index + 1}.`;
        return;
      }
    }

    const content = {
      title: this.sectionTitle.trim(),

      items: this.items.map((item, index) => ({
        id: item.id.trim() || `event-${index + 1}`,
        slug:
          item.slug.trim() ||
          this.makeSlug(item.id || item.title),
        day: item.day.trim().toUpperCase(),
        date: item.date.trim(),
        title: item.title.trim(),
        description: item.description.trim(),
        imageField: `items[${index}].image`,
        imageAlt: item.imageAlt.trim() || item.title.trim(),
      })),

      calendarIconField: 'calendarIcon',
    };

    const itemImages: Record<number, File> = {};

    this.items.forEach((item, index) => {
      if (item.imageFile) {
        itemImages[index] = item.imageFile;
      }
    });

    this.saving = true;

    const request = this.isEditMode
      ? this.api.updateEventsCalendar(
          content,
          itemImages,
          this.calendarIconFile ?? undefined
        )
      : this.api.createEventsCalendar(
          content,
          itemImages,
          this.calendarIconFile ?? undefined
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
          this.message =
            response?.message ??
            (this.isEditMode
              ? 'Events Calendar updated successfully.'
              : 'Events Calendar created successfully.');

          this.loadEventsCalendar();
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ?? 'Failed to save Events Calendar.';
        },
      });
  }

  deleteEventsCalendar(): void {
    if (
      !confirm(
        'Are you sure you want to delete the entire Events Calendar section?'
      )
    ) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api
      .deleteEventsCalendar()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.clearPreviews();

          this.sectionTitle = 'Events Calendar';
          this.items = [];
          this.calendarIconFile = null;
          this.calendarIconPreview = '';
          this.existingCalendarIconUrl = '';
          this.isEditMode = false;

          this.message = 'Events Calendar section deleted successfully.';
        },

        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ?? 'Failed to delete Events Calendar.';
        },
      });
  }

  resetForm(): void {
    this.loadEventsCalendar();
  }

  private clearPreviews(): void {
    this.items.forEach((item) => {
      this.revokeUrl(item.imagePreview);
    });

    this.revokeUrl(this.calendarIconPreview);
  }

  private revokeUrl(url: string): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
