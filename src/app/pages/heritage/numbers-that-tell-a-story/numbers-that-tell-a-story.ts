
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

interface HeritageMetric {
  label: string;
  description: string;
}

@Component({
  selector: 'app-numbers-that-tell-a-story',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './numbers-that-tell-a-story.html',
  styleUrl: './numbers-that-tell-a-story.css',
})
export class NumbersThatTellAStory implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  title = 'Numbers That Tell a Story';
  backgroundColor = '#000000';

  metrics: HeritageMetric[] = [];

  decorativeIcon: File | null = null;
  iconPreview: string | null = null;
  existingIconUrl: string | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.setDefaultMetrics();
    this.loadHeritageNumbers();
  }

  ngOnDestroy(): void {
    this.clearIconPreview();
  }

  private setDefaultMetrics(): void {
    this.metrics = [
      {
        label: 'COOPERATIVE SOCIETIES',
        description: 'Cooperative societies supported across Telangana.',
      },
      {
        label: 'WEAVER FAMILIES',
        description: 'Weaver families empowered through handloom initiatives.',
      },
      {
        label: 'DISTRICTS REACHED',
        description: "Districts covered under TGSCO's network.",
      },
      {
        label: 'YEARS OF SERVICE',
        description: 'Years of continuous service to the handloom community.',
      },
      {
        label: 'PRODUCTS SOLD',
        description: 'Products sold, connecting artisans with customers.',
      },
    ];
  }

  loadHeritageNumbers(): void {
    this.isLoading = true;
    this.message = '';

    this.api
      .getHeritageNumbers()
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
          const content = data?.content ?? {};

          if (
            content &&
            typeof content === 'object' &&
            content.title
          ) {
            this.title = content.title ?? '';
            this.backgroundColor = content.backgroundColor ?? '#000000';

            const images = Array.isArray(data?.images)
              ? data.images
              : [];

            const iconImage = images.find(
              (image: any) => image.field === 'decorativeIcon'
            );

            this.existingIconUrl = iconImage?.url ?? null;

            if (Array.isArray(content.metrics)) {
              this.metrics = content.metrics.map((metric: any) => ({
                label: metric?.label ?? '',
                description: metric?.description ?? '',
              }));
            }

            this.isEditing = true;
          } else {
            this.isEditing = false;
            this.existingIconUrl = null;
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Unable to load Numbers That Tell a Story content.',
            'error'
          );
        },
      });
  }

  onIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Image size must be 5 MB or less.', 'error');
      input.value = '';
      return;
    }

    this.clearIconPreview();

    this.decorativeIcon = file;
    this.iconPreview = URL.createObjectURL(file);

    this.message = '';
    this.cdr.markForCheck();
  }

  removeSelectedIcon(): void {
    this.decorativeIcon = null;
    this.clearIconPreview();
    this.cdr.markForCheck();
  }

  saveHeritageNumbers(): void {
    if (!this.title.trim()) {
      this.showMessage('Please enter the section title.', 'error');
      return;
    }

    if (this.metrics.length !== 5) {
      this.showMessage('Exactly five metrics are required.', 'error');
      return;
    }

    for (const metric of this.metrics) {
      if (!metric.label.trim() || !metric.description.trim()) {
        this.showMessage(
          'Please enter a label and description for every metric.',
          'error'
        );
        return;
      }
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(this.backgroundColor)) {
      this.showMessage(
        'Enter a valid six-digit hexadecimal background color.',
        'error'
      );
      return;
    }

    if (!this.isEditing && !this.decorativeIcon) {
      this.showMessage(
        'Please upload the decorative icon before creating the content.',
        'error'
      );
      return;
    }

    const content = {
      title: this.title.trim(),
      metrics: this.metrics.map((metric) => ({
        label: metric.label.trim(),
        description: metric.description.trim(),
      })),
      backgroundColor: this.backgroundColor,
      iconField: 'decorativeIcon',
    };

    this.isSaving = true;
    this.message = '';

    const wasEditing = this.isEditing;

    const request = wasEditing
      ? this.api.updateHeritageNumbers(
          content,
          this.decorativeIcon ?? undefined
        )
      : this.api.createHeritageNumbers(
          content,
          this.decorativeIcon ?? undefined
        );

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
          this.decorativeIcon = null;
          this.clearIconPreview();

          this.showMessage(
            response?.message ??
              (wasEditing
                ? 'Numbers That Tell a Story updated successfully.'
                : 'Numbers That Tell a Story created successfully.'),
            'success'
          );

          this.loadHeritageNumbers();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to save Numbers That Tell a Story content.',
            'error'
          );
        },
      });
  }

  deleteHeritageNumbers(): void {
    if (
      !window.confirm(
        'Are you sure you want to delete Numbers That Tell a Story content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.message = '';

    this.api
      .deleteHeritageNumbers()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.title = 'Numbers That Tell a Story';
          this.backgroundColor = '#000000';

          this.decorativeIcon = null;
          this.existingIconUrl = null;

          this.clearIconPreview();
          this.setDefaultMetrics();

          this.isEditing = false;

          this.showMessage(
            response?.message ??
              'Numbers That Tell a Story content deleted successfully.',
            'success'
          );
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to delete Numbers That Tell a Story content.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.decorativeIcon = null;
    this.clearIconPreview();
    this.message = '';

    if (this.isEditing) {
      this.loadHeritageNumbers();
    } else {
      this.title = 'Numbers That Tell a Story';
      this.backgroundColor = '#000000';
      this.existingIconUrl = null;
      this.setDefaultMetrics();
    }

    this.cdr.markForCheck();
  }

  private clearIconPreview(): void {
    if (this.iconPreview) {
      URL.revokeObjectURL(this.iconPreview);
    }

    this.iconPreview = null;
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
