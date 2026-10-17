
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface Milestone {
  number: string;
  title: string;
  description: string;
}

interface MilestonesContent {
  title: string;
  description: string;
  milestones: Milestone[];
  footerText: string;
}

@Component({
  selector: 'app-milestones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './milestones.html',
  styleUrl: './milestones.css'
})
export class Milestones implements OnInit {
  content: MilestonesContent = this.getDefaultContent();

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly api: Api,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMilestones();
  }

  private getDefaultContent(): MilestonesContent {
    return {
      title: 'Milestones Along the Way',
      description:
        'For nearly five decades, TGSCO has nurtured Telangana’s artisanal weaving traditions - from humble beginnings to a globally-reaching digital future.',
      milestones: [
        {
          number: '01',
          title: 'Formation',
          description:
            'The founding of TGSCO to unify and support Telangana’s handloom cooperatives.'
        },
        {
          number: '02',
          title: 'Expansion',
          description:
            'Growth of cooperative societies and weaver membership across districts.'
        },
        {
          number: '03',
          title: 'Recognition',
          description:
            'National and state-level awards for craftsmanship and welfare initiatives.'
        },
        {
          number: '04',
          title: 'Digital Transformation',
          description:
            'The move toward e-commerce and digital storytelling to reach new audiences.'
        },
        {
          number: '05',
          title: 'Today',
          description:
            'A renewed commitment to heritage, sustainability, and global reach.'
        }
      ],
      footerText:
        'Empowering 100,000+ weavers and preserving generations of state artistry.'
    };
  }

  loadMilestones(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getMilestonesAPI()
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
            !Array.isArray(data) &&
            (
              data.title !== undefined ||
              data.description !== undefined ||
              Array.isArray(data.milestones)
            )
          ) {
            this.content = {
              title: data.title ?? 'Milestones Along the Way',
              description: data.description ?? '',
              milestones: Array.isArray(data.milestones)
                ? data.milestones.map((item: any, index: number) => ({
                    number: String(item?.number ?? String(index + 1).padStart(2, '0')),
                    title: item?.title ?? '',
                    description: item?.description ?? ''
                  }))
                : this.getDefaultContent().milestones,
              footerText: data.footerText ?? ''
            };

            this.isExistingContent = true;
          } else {
            this.content = this.getDefaultContent();
            this.isExistingContent = false;
          }

          this.successMessage = '';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load milestones:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to load milestones. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  addMilestone(): void {
    const nextNumber = String(this.content.milestones.length + 1).padStart(2, '0');

    this.content.milestones.push({
      number: nextNumber,
      title: '',
      description: ''
    });
  }

  removeMilestone(index: number): void {
    this.content.milestones.splice(index, 1);
  }

  moveMilestone(index: number, direction: number): void {
    const newIndex = index + direction;

    if (
      newIndex < 0 ||
      newIndex >= this.content.milestones.length
    ) {
      return;
    }

    const items = this.content.milestones;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
  }

  saveMilestones(): void {
    if (this.isSaving || this.isDeleting) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: MilestonesContent = {
      title: this.content.title.trim(),
      description: this.content.description.trim(),
      milestones: this.content.milestones.map((item) => ({
        number: item.number.trim(),
        title: item.title.trim(),
        description: item.description.trim()
      })),
      footerText: this.content.footerText.trim()
    };

    const request = this.isExistingContent
      ? this.api.updateMilestonesAPI(payload)
      : this.api.addMilestonesAPI(payload);

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
            response?.message ?? 'Milestones saved successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to save milestones:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to save milestones. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  deleteMilestones(): void {
    if (!this.isExistingContent || this.isDeleting || this.isSaving) {
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete all milestones content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteMilestonesAPI()
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
          this.successMessage = 'Milestones content deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete milestones:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to delete milestones. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  resetForm(): void {
    this.content = this.getDefaultContent();
    this.successMessage = '';
    this.errorMessage = '';
  }
}
