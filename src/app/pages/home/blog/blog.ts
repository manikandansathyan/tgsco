
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

interface BlogArticle {
  date: string;
  title: string;
  description: string;
  buttonText: string;
  url: string;
  imageUrl: string;
  imageFile: File | null;
}

interface BlogContent {
  title: string;
  articles: BlogArticle[];
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog.html',
  styleUrl: './blog.css',
})
export class Blog implements OnInit {
  private readonly api = inject(Api);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  content: BlogContent = this.getDefaultContent();

  ngOnInit(): void {
    this.loadBlog();
  }

  private getDefaultContent(): BlogContent {
    return {
      title: 'Tales Worth Weaving',
      articles: [
        {
          date: 'January 15, 2026',
          title: 'The Festival Saree',
          description:
            'Understanding the royal symbolism behind traditional gold and silk borders.',
          buttonText: 'READ MORE',
          url: '/blog/the-festival-saree',
          imageUrl: '',
          imageFile: null,
        },
        {
          date: 'January 15, 2026',
          title: 'Caring for Your Handloom',
          description:
            'Understanding the royal symbolism behind traditional gold and silk borders.',
          buttonText: 'READ MORE',
          url: '/blog/caring-for-your-handloom',
          imageUrl: '',
          imageFile: null,
        },
        {
          date: 'January 15, 2026',
          title: 'Inside the Ikat',
          description:
            'Understanding the royal symbolism behind traditional gold and silk borders.',
          buttonText: 'READ MORE',
          url: '/blog/inside-the-ikat',
          imageUrl: '',
          imageFile: null,
        },
      ],
    };
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

  loadBlog(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getBlogAPI()
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
          const returnedImages = Array.isArray(data?.images)
            ? data.images
            : [];

          if (
            savedContent &&
            typeof savedContent.title === 'string' &&
            Array.isArray(savedContent.articles)
          ) {
            this.content = {
              title: savedContent.title,
              articles: savedContent.articles.map(
                (article: any, index: number): BlogArticle => {
                  const imageField = `articles[${index}].image`;

                  const matchedImage = returnedImages.find(
                    (image: any) => image.field === imageField
                  );

                  return {
                    date: article.date ?? '',
                    title: article.title ?? '',
                    description: article.description ?? '',
                    buttonText: article.buttonText ?? 'READ MORE',
                    url: article.url ?? '',
                    imageUrl:
                      matchedImage?.url ??
                      this.getImageUrl(
                        article.imageUrl ??
                        article.image ??
                        article.image_url
                      ),
                    imageFile: null,
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
          console.error('Failed to load Blog content:', error);

          this.errorMessage =
            'Could not load saved blog content. Please check the API response.';

          this.cdr.markForCheck();
        },
      });
  }

  addArticle(): void {
    this.content.articles.push({
      date: '',
      title: '',
      description: '',
      buttonText: 'READ MORE',
      url: '',
      imageUrl: '',
      imageFile: null,
    });
  }

  removeArticle(index: number): void {
    if (this.content.articles.length <= 1) {
      this.errorMessage = 'At least one article is required.';
      return;
    }

    this.content.articles.splice(index, 1);
    this.errorMessage = '';
  }

  onImageSelected(event: Event, index: number): void {
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

    const article = this.content.articles[index];

    if (article.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(article.imageUrl);
    }

    article.imageFile = file;
    article.imageUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  saveBlog(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.content.title.trim()) {
      this.errorMessage = 'Please enter the blog section title.';
      return;
    }

    if (this.content.articles.length === 0) {
      this.errorMessage = 'Add at least one article.';
      return;
    }

    const invalidArticle = this.content.articles.some(
      (article) =>
        !article.date.trim() ||
        !article.title.trim() ||
        !article.description.trim() ||
        !article.buttonText.trim() ||
        !article.url.trim()
    );

    if (invalidArticle) {
      this.errorMessage =
        'Please complete all fields for every article.';
      return;
    }

    const payload = {
      title: this.content.title.trim(),
      articles: this.content.articles.map((article, index) => ({
        date: article.date.trim(),
        title: article.title.trim(),
        description: article.description.trim(),
        buttonText: article.buttonText.trim(),
        url: article.url.trim(),
        imageField: `articles[${index}].image`,
      })),
    };

    const images = this.content.articles.map((article, index) => ({
      index,
      image: article.imageFile,
    }));


    this.isSaving = true;

    const request$ = this.isExistingContent
      ? this.api.updateBlogAPI(payload, images)
      : this.api.addBlogAPI(payload, images);

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
            response?.message ?? 'Blog content saved successfully.';

          this.content.articles.forEach((article) => {
            article.imageFile = null;
          });

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to save Blog content:', error);
          this.errorMessage =
            error?.error?.message ??
            'Failed to save blog content. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  deleteBlog(): void {
    if (!this.isExistingContent) {
      return;
    }

    if (!confirm('Are you sure you want to delete the Blog section?')) {
      return;
    }

    this.isDeleting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api
      .deleteBlogAPI()
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
          this.isExistingContent = false;
          this.successMessage = 'Blog section deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to delete Blog section:', error);
          this.errorMessage =
            error?.error?.message ??
            'Failed to delete Blog section. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }
}
