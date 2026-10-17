import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-about-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements OnInit {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  title = 'ABOUT TGSCO';
  imageAlt =
    'Telangana handloom weavers working at a traditional loom';

  imageUrl = '';
  imagePreview = '';
  heroImage: File | null = null;

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadAboutHero();
  }

  loadAboutHero(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getAboutHeroAPI()
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

          if (
            content &&
            (content.title || content.imageAlt || content.heroImage ||
              content.imageUrl || content.image)
          ) {
            this.isExistingContent = true;
            this.title = content.title ?? this.title;
            this.imageAlt =
              content.imageAlt ??
              content.image_alt ??
              this.imageAlt;

            const image =
              content.heroImage ??
              content.imageUrl ??
              content.image_url ??
              content.image ??
              '';

            this.imageUrl =
              typeof image === 'string'
                ? image
                : image?.url ?? '';

            this.imagePreview = this.imageUrl;
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load About Hero:', error);
          this.errorMessage =
            error?.error?.message ??
            'Unable to load About Hero content.';
          this.cdr.markForCheck();
        },
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.heroImage = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  saveAboutHero(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the hero title.';
      return;
    }

    const content = {
      title: this.title.trim(),
      imageAlt: this.imageAlt.trim(),
    };

    this.isSaving = true;

    const request$ = this.isExistingContent
      ? this.api.updateAboutHeroAPI(content, this.heroImage)
      : this.api.addAboutHeroAPI(content, this.heroImage);

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
          this.heroImage = null;
          this.successMessage =
            response?.message ??
            response?.data?.message ??
            'About Hero saved successfully.';

          this.loadAboutHero();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to save About Hero:', error);
          this.errorMessage =
            error?.error?.message ??
            'Unable to save About Hero content.';
          this.cdr.markForCheck();
        },
      });
  }

  deleteAboutHero(): void {
    if (!this.isExistingContent) return;

    if (!confirm('Are you sure you want to delete the About Hero section?')) {
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api
      .deleteAboutHeroAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.isExistingContent = false;
          this.title = 'ABOUT TGSCO';
          this.imageAlt =
            'Telangana handloom weavers working at a traditional loom';
          this.imageUrl = '';
          this.imagePreview = '';
          this.heroImage = null;

          this.successMessage =
            'About Hero section deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to delete About Hero:', error);
          this.errorMessage =
            error?.error?.message ??
            'Unable to delete About Hero content.';
          this.cdr.markForCheck();
        },
      });
  }
}
