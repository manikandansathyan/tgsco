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

interface NewsEventCard {
  category: string;
  title: string;
  description: string;
  buttonText: string;
  url: string;
  imageUrl: string;
  imageFile: File | null;
  imagePreview: string;
}

@Component({
  selector: 'app-news-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './news-events.html',
  styleUrl: './news-events.css',
})
export class NewsEvents implements OnInit {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isSaving = false;
  isExistingContent = false;
  successMessage = '';
  errorMessage = '';

  title = "What's Happening at TGSCO";

  button = {
    label: 'View All News & Events',
    url: '/news-events',
  };

  cards: NewsEventCard[] = [
    {
      category: 'EXHIBITION',
      title: 'Upcoming Spring Handloom Exhibition in Hyderabad',
      description:
        'Meet weavers and purchase certified GI-tagged textiles directly.',
      buttonText: 'READ MORE',
      url: '/news-events/upcoming-spring-handloom-exhibition-hyderabad',
      imageUrl: '',
      imageFile: null,
      imagePreview: '',
    },
    {
      category: 'NEW',
      title: 'New collection launches',
      description:
        'Meet weavers and purchase certified GI-tagged textiles directly.',
      buttonText: 'READ MORE',
      url: '/news-events/new-collection-launches',
      imageUrl: '',
      imageFile: null,
      imagePreview: '',
    },
    {
      category: 'ANNOUNCEMENT',
      title: 'Government scheme announcements',
      description:
        'Empowering 500 young weavers with advanced design training.',
      buttonText: 'READ MORE',
      url: '/news-events/government-scheme-announcements',
      imageUrl: '',
      imageFile: null,
      imagePreview: '',
    },
    {
      category: 'EVENT',
      title: 'Awards and recognitions',
      description:
        'Empowering 500 young weavers with advanced design training.',
      buttonText: 'READ MORE',
      url: '/news-events/awards-and-recognitions',
      imageUrl: '',
      imageFile: null,
      imagePreview: '',
    },
  ];

  ngOnInit(): void {
    this.loadNewsEvents();
  }

  loadNewsEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getNewsEventsAPI()
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
            (content.title ||
              Array.isArray(content.cards) ||
              content.button)
          ) {
            this.isExistingContent = true;
            this.title = content.title ?? this.title;

            if (content.button) {
              this.button = {
                label: content.button.label ?? this.button.label,
                url: content.button.url ?? this.button.url,
              };
            }

            if (Array.isArray(content.cards)) {
              this.cards = content.cards.map(
                (item: any, index: number) => {
                  const defaultCard = this.cards[index] ?? {
                    category: '',
                    title: '',
                    description: '',
                    buttonText: 'READ MORE',
                    url: '',
                    imageUrl: '',
                    imageFile: null,
                    imagePreview: '',
                  };

                  const imageValue =
                    item.imageUrl ??
                    item.image_url ??
                    item.image ??
                    '';

                  const imageUrl =
                    typeof imageValue === 'string'
                      ? imageValue
                      : imageValue?.url ?? '';

                  return {
                    category: item.category ?? defaultCard.category,
                    title: item.title ?? defaultCard.title,
                    description:
                      item.description ?? defaultCard.description,
                    buttonText:
                      item.buttonText ??
                      item.button_text ??
                      defaultCard.buttonText,
                    url: item.url ?? defaultCard.url,
                    imageUrl,
                    imageFile: null,
                    imagePreview: imageUrl,
                  };
                }
              );
            }
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load News & Events:', error);
          this.errorMessage =
            error?.error?.message ??
            'Unable to load News & Events content.';
          this.cdr.markForCheck();
        },
      });
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

    this.errorMessage = '';

    const card = this.cards[index];
    card.imageFile = file;
    card.imagePreview = URL.createObjectURL(file);
  }

  addCard(): void {
    this.cards.push({
      category: '',
      title: '',
      description: '',
      buttonText: 'READ MORE',
      url: '',
      imageUrl: '',
      imageFile: null,
      imagePreview: '',
    });
  }

  removeCard(index: number): void {
    if (this.cards.length <= 1) {
      this.errorMessage = 'At least one card is required.';
      return;
    }

    this.cards.splice(index, 1);
    this.errorMessage = '';
  }

  saveNewsEvents(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter a section title.';
      return;
    }

    if (this.cards.some((card) => !card.title.trim())) {
      this.errorMessage = 'Please enter a title for every card.';
      return;
    }

    const content = {
      title: this.title,
      cards: this.cards.map((card) => ({
        category: card.category,
        title: card.title,
        description: card.description,
        buttonText: card.buttonText,
        url: card.url,
      })),
      button: {
        label: this.button.label,
        url: this.button.url,
      },
    };

    const images = this.cards.map((card, index) => ({
      index,
      image: card.imageFile,
    }));

    this.isSaving = true;

    const request$ = this.isExistingContent
      ? this.api.updateNewsEventsAPI(content, images)
      : this.api.addNewsEventsAPI(content, images);

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
            response?.data?.message ??
            'News & Events saved successfully.';

          this.loadNewsEvents();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to save News & Events:', error);
          this.errorMessage =
            error?.error?.message ??
            'Unable to save News & Events content.';
          this.cdr.markForCheck();
        },
      });
  }

  deleteNewsEvents(): void {
    if (
      !confirm(
        'Are you sure you want to delete the News & Events section?'
      )
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    this.api
      .deleteNewsEventsAPI()
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
          this.title = "What's Happening at TGSCO";
          this.button = {
            label: 'View All News & Events',
            url: '/news-events',
          };

          this.cards = this.cards.map((card) => ({
            ...card,
            imageUrl: '',
            imageFile: null,
            imagePreview: '',
          }));

          this.successMessage =
            'News & Events section deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to delete News & Events:', error);
          this.errorMessage =
            error?.error?.message ??
            'Unable to delete News & Events content.';
          this.cdr.markForCheck();
        },
      });
  }
}
