
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface StoryStat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './story.html',
  styleUrl: './story.css',
})
export class Story implements OnInit {
  title = '';
  description = '';
  buttonLabel = '';
  buttonUrl = '';
  imageAlt = '';
  imageUrl = '';
  storyImage: File | null = null;
  videoUrl = '';
  videoAlt = '';
  stats: StoryStat[] = [];

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOurStory();
  }

  loadOurStory(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getOurStoryAPI()
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

          this.title = content?.title ?? '';
          this.description = content?.description ?? '';
          this.buttonLabel = content?.button?.label ?? '';
          this.buttonUrl = content?.button?.url ?? '';
          this.imageAlt = content?.imageAlt ?? '';
          this.videoUrl = content?.videoUrl ?? '';
          this.videoAlt = content?.videoAlt ?? '';

          const images: any[] = Array.isArray(data?.images)
            ? data.images
            : [];

          const storyImage = images.find(
            (image: any) =>
              image.field === 'storyImage' ||
              image.field === 'image' ||
              image.field === 'ourStoryImage'
          );

          this.imageUrl =
            storyImage?.url ??
            content?.imageUrl ??
            content?.image?.url ??
            '';

          this.storyImage = null;

          this.stats = Array.isArray(content?.stats)
            ? content.stats.map((stat: any) => ({
                value: stat.value ?? '',
                label: stat.label ?? '',
              }))
            : [];

          this.isExistingContent = !!data?.id;

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Our Story API error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ??
                'Unable to load Our Story content.';

          this.cdr.markForCheck();
        },
      });
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

    if (this.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageUrl);
    }

    this.storyImage = file;
    this.imageUrl = URL.createObjectURL(file);
    this.errorMessage = '';

    this.cdr.markForCheck();
  }

  addStat(): void {
    if (this.stats.length >= 6) {
      return;
    }

    this.stats.push({ value: '', label: '' });
    this.cdr.markForCheck();
  }

  removeStat(index: number): void {
    this.stats.splice(index, 1);
    this.cdr.markForCheck();
  }

  saveOurStory(): void {
    if (!this.title.trim()) {
      this.errorMessage = 'Please enter a title.';
      return;
    }

    if (!this.description.trim()) {
      this.errorMessage = 'Please enter a description.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const content = {
      title: this.title,
      description: this.description,
      button: {
        label: this.buttonLabel,
        url: this.buttonUrl,
      },
      imageAlt: this.imageAlt,
      stats: this.stats.map((stat) => ({
        value: stat.value,
        label: stat.label,
      })),
      videoUrl: this.videoUrl,
      videoAlt: this.videoAlt,
    };

    const request$ = this.isExistingContent
      ? this.api.updateOurStoryAPI(content, this.storyImage)
      : this.api.addOurStoryAPI(content, this.storyImage);

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
        next: () => {
          this.successMessage = 'Our Story content saved successfully.';
          this.cdr.markForCheck();
          this.loadOurStory();
        },
        error: (error: any) => {
          console.error('Save Our Story error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ??
                'Failed to save Our Story content.';

          this.cdr.markForCheck();
        },
      });
  }

  deleteOurStory(): void {
    if (
      !confirm('Are you sure you want to delete the entire Our Story section?')
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteOurStoryAPI()
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
          this.title = '';
          this.description = '';
          this.buttonLabel = '';
          this.buttonUrl = '';
          this.imageAlt = '';
          this.imageUrl = '';
          this.storyImage = null;
          this.videoUrl = '';
          this.videoAlt = '';
          this.stats = [];
          this.isExistingContent = false;

          this.successMessage = 'Our Story section deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Delete Our Story error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ??
                'Failed to delete Our Story content.';

          this.cdr.markForCheck();
        },
      });
  }
}
