
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface WhoWeAreContent {
  title: string;
  paragraphs: string[];
  quote: string;
  supportingText: string;
  button: {
    label: string;
    url: string;
  };
  videoUrl: string;
  videoAlt: string;
}

@Component({
  selector: 'app-who-we-are',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './story.html',
  styleUrl: './story.css'
})
export class Story implements OnInit {
  content: WhoWeAreContent = this.getDefaultContent();

  primaryImage: File | null = null;
  primaryImageUrl = '';
  primaryImagePreview = '';

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly api: Api,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadWhoWeAre();
  }

  private getDefaultContent(): WhoWeAreContent {
    return {
      title: 'Who We Are',
      paragraphs: [
        'The Telangana State Handloom Weavers Co-operative Society Limited (TGSCO) is the official cooperative body dedicated to the welfare, empowerment, and promotion of Telangana’s handloom weaving communities.',
        'We exist at the intersection of heritage and livelihood, protecting centuries-old craft traditions while creating sustainable, dignified incomes for the artisans who carry them forward.'
      ],
      quote:
        'We are not just a retailer of handloom products. We are the bridge between Telangana’s weaving villages and the world.',
      supportingText:
        'Supporting over 10,000 artisan families with equitable wages and preserving indigenous textile crafts.',
      button: {
        label: 'Learn More',
        url: '/about'
      },
      videoUrl:
        'https://blr1.digitaloceanspaces.com/mbm/videos/d4c50448-0774-4349-8918-8948ec2e6aac-13049211_1080_1920_30fps.mp4',
      videoAlt: 'TGSCO artisans and handloom heritage'
    };
  }

  loadWhoWeAre(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getWhoWeAreAPI()
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
            !Array.isArray(data)
          ) {
            this.content = {
              title: data.title ?? 'Who We Are',
              paragraphs: Array.isArray(data.paragraphs)
                ? [...data.paragraphs]
                : this.getDefaultContent().paragraphs,
              quote: data.quote ?? '',
              supportingText: data.supportingText ?? '',
              button: {
                label: data.button?.label ?? 'Learn More',
                url: data.button?.url ?? '/about'
              },
              videoUrl: data.videoUrl ?? '',
              videoAlt: data.videoAlt ?? ''
            };

            this.primaryImageUrl =
              data.primaryImageUrl ??
              data.primary_image_url ??
              data.primaryImage?.url ??
              data.primaryImage ??
              data.primary_image ??
              data.imageUrl ??
              data.image ??
              '';

            const imageValue =
              data.primaryImageUrl ??
              data.primary_image_url ??
              data.primaryImage?.url ??
              data.primaryImage ??
              data.primary_image ??
              data.imageUrl ??
              data.image ??
              '';

            this.primaryImageUrl =
              typeof imageValue === 'string'
                ? imageValue
                : typeof imageValue?.url === 'string'
                  ? imageValue.url
                  : '';

            this.primaryImagePreview = this.primaryImageUrl;

            this.primaryImagePreview = this.primaryImageUrl;
            this.isExistingContent = true;
          } else {
            this.content = this.getDefaultContent();
            this.isExistingContent = false;
          }

          this.primaryImage = null;
          this.successMessage = '';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load Who We Are content:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to load Who We Are content. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  addParagraph(): void {
    this.content.paragraphs.push('');
  }

  removeParagraph(index: number): void {
    if (this.content.paragraphs.length > 1) {
      this.content.paragraphs.splice(index, 1);
    }
  }

  onPrimaryImageSelected(event: Event): void {
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

    this.primaryImage = file;
    this.errorMessage = '';
    this.primaryImagePreview = URL.createObjectURL(file);
  }

  clearSelectedImage(): void {
    this.primaryImage = null;
    this.primaryImagePreview = this.primaryImageUrl;
  }

  saveWhoWeAre(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: WhoWeAreContent = {
      title: this.content.title.trim(),
      paragraphs: this.content.paragraphs.map((paragraph) =>
        paragraph.trim()
      ),
      quote: this.content.quote.trim(),
      supportingText: this.content.supportingText.trim(),
      button: {
        label: this.content.button.label.trim(),
        url: this.content.button.url.trim()
      },
      videoUrl: this.content.videoUrl.trim(),
      videoAlt: this.content.videoAlt.trim()
    };

    const request = this.isExistingContent
      ? this.api.updateWhoWeAreAPI(payload, this.primaryImage)
      : this.api.addWhoWeAreAPI(payload, this.primaryImage);

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
            response?.message ?? 'Who We Are content saved successfully.';

          this.primaryImage = null;
          this.loadWhoWeAre();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to save Who We Are content:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to save Who We Are content. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  deleteWhoWeAre(): void {
    if (!this.isExistingContent || this.isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete the Who We Are content?'
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteWhoWeAreAPI()
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
          this.primaryImage = null;
          this.primaryImageUrl = '';
          this.primaryImagePreview = '';
          this.isExistingContent = false;
          this.successMessage =
            'Who We Are content deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete Who We Are content:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to delete Who We Are content. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  resetForm(): void {
    this.content = this.getDefaultContent();
    this.primaryImage = null;
    this.primaryImagePreview = this.primaryImageUrl;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
