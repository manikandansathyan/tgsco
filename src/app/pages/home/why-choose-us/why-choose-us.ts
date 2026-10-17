import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface WhyChooseUsCard {
  title: string;
  description: string;
}

@Component({
  selector: 'app-why-choose-us',
  standalone: true, 
  imports: [CommonModule, FormsModule],
  templateUrl: './why-choose-us.html',
  styleUrl: './why-choose-us.css',
})
export class WhyChooseUs implements OnInit {
  title = 'More Than a Purchase. A Promise.';

  cards: WhyChooseUsCard[] = [
    {
      title: 'Government-Backed',
      description:
        'As an official state initiative, we guarantee genuine handlooms with authentic GI tags and direct certification.',
    },
    {
      title: 'Direct Weaver Support',
      description:
        '100% of profits are distributed directly back to our weaving clusters, ensuring fair wages and healthy communities.',
    },
    {
      title: '100% Handwoven',
      description:
        'No powerlooms, no synthetic shortcuts. Every piece of fabric is crafted purely by hand with generational pride.',
    },
  ];

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly api: Api,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWhyChooseUs();
  }

  loadWhyChooseUs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .getWhyChooseUsAPI()
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

          if (content && typeof content === 'object') {
            this.title = content.title ?? this.title;

            if (Array.isArray(content.cards)) {
              this.cards = content.cards.map((card: any) => ({
                title: card?.title ?? '',
                description: card?.description ?? '',
              }));
            }

            this.isExistingContent = !!data?.id || !!content?.id;
          } else {
            this.isExistingContent = false;
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load Why Choose Us:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to load the Why Choose Us section. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  saveWhyChooseUs(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.cards.length !== 3) {
      this.errorMessage = 'This section must contain exactly three cards.';
      return;
    }

    for (let i = 0; i < this.cards.length; i++) {
      if (
        !this.cards[i].title.trim() ||
        !this.cards[i].description.trim()
      ) {
        this.errorMessage =
          `Please complete the title and description for card ${i + 1}.`;
        return;
      }
    }

    const content = {
      title: this.title.trim(),
      cards: this.cards.map((card) => ({
        title: card.title.trim(),
        description: card.description.trim(),
      })),
    };

    this.isSaving = true;

    const request = this.isExistingContent
      ? this.api.updateWhyChooseUsAPI(content)
      : this.api.addWhyChooseUsAPI(content);

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
          this.isExistingContent = true;
          this.successMessage =
            response?.message ??
            'Why Choose Us section saved successfully.';

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to save Why Choose Us:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to save the Why Choose Us section. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  deleteWhyChooseUs(): void {
    if (
      !window.confirm(
        'Are you sure you want to delete the Why Choose Us section?'
      )
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteWhyChooseUsAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.title = 'More Than a Purchase. A Promise.';
          this.cards = [
            { title: 'Government-Backed', description: '' },
            { title: 'Direct Weaver Support', description: '' },
            { title: '100% Handwoven', description: '' },
          ];

          this.isExistingContent = false;
          this.successMessage =
            'Why Choose Us section deleted successfully.';

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete Why Choose Us:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to delete the section. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }
}
