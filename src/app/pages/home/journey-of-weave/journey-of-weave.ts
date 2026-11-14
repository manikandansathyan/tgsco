
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface JourneyStep {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-journey-of-weave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journey-of-weave.html',
  styleUrl: './journey-of-weave.css',
})
export class JourneyOfWeave implements OnInit {
  title = '';
  description = '';
  highlight = '';
  closing = '';
  steps: JourneyStep[] = [];

  isLoading = true;
  isSaving = false;
  isDeleting = false;
  isExistingContent = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadJourney();
  }

  loadJourney(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .getJourneyAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('Journey API response:', response);

          const data = response?.data ?? response;
          const content = data?.content ?? data;

          this.isExistingContent = !!data?.id;

          this.title = content?.title ?? '';
          this.description = content?.description ?? '';
          this.highlight = content?.highlight ?? '';
          this.closing = content?.closing ?? '';

          this.steps = Array.isArray(content?.steps)
            ? content.steps.map((step: any, index: number) => ({
                number: step?.number ?? String(index + 1).padStart(2, '0'),
                title: step?.title ?? '',
                description: step?.description ?? '',
              }))
            : [];

          if (this.steps.length === 0) {
            this.steps = [this.createEmptyStep(1)];
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load journey content:', error);

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load Journey of Weave content. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  createEmptyStep(index: number): JourneyStep {
    return {
      number: String(index).padStart(2, '0'),
      title: '',
      description: '',
    };
  }

  addStep(): void {
    this.steps.push(this.createEmptyStep(this.steps.length + 1));
    this.errorMessage = '';
    this.successMessage = '';
  }

  removeStep(index: number): void {
    if (this.steps.length <= 1) {
      this.errorMessage = 'At least one journey step is required.';
      return;
    }

    this.steps.splice(index, 1);
    this.updateStepNumbers();
    this.errorMessage = '';
    this.successMessage = '';
  }

  updateStepNumbers(): void {
    this.steps = this.steps.map((step, index) => ({
      ...step,
      number: String(index + 1).padStart(2, '0'),
    }));
  }

  saveJourney(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (!this.description.trim()) {
      this.errorMessage = 'Please enter the section description.';
      return;
    }

    if (this.steps.length === 0) {
      this.errorMessage = 'Please add at least one journey step.';
      return;
    }

    const invalidStep = this.steps.find(
      (step) => !step.title.trim() || !step.description.trim()
    );

    if (invalidStep) {
      this.errorMessage =
        'Please enter a title and description for every journey step.';
      return;
    }

    const content = {
      title: this.title.trim(),
      description: this.description.trim(),
      highlight: this.highlight.trim(),
      closing: this.closing.trim(),
      steps: this.steps.map((step, index) => ({
        number: String(index + 1).padStart(2, '0'),
        title: step.title.trim(),
        description: step.description.trim(),
      })),
    };

    this.isSaving = true;

    const request = this.isExistingContent
      ? this.api.updateJourneyAPI(content)
      : this.api.addJourneyAPI(content);

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
          console.log('Journey save response:', response);

          this.isExistingContent = true;
          this.successMessage =
            response?.message || 'Journey of Weave content saved successfully.';

          this.errorMessage = '';
          this.cdr.markForCheck();

          this.loadJourney();
        },
        error: (error: any) => {
          console.error('Failed to save journey content:', error);

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to save Journey of Weave content. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  deleteJourney(): void {
    if (!this.isExistingContent || this.isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete the Journey of Weave section? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isDeleting = true;

    this.api
      .deleteJourneyAPI()
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
          console.log('Journey delete response:', response);

          this.isExistingContent = false;
          this.title = '';
          this.description = '';
          this.highlight = '';
          this.closing = '';
          this.steps = [this.createEmptyStep(1)];

          this.successMessage =
            response?.message || 'Journey of Weave section deleted successfully.';

          this.errorMessage = '';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete journey content:', error);

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to delete Journey of Weave content. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  trackByIndex(index: number): number {
    return index;
  }
}
