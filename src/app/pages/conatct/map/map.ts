
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface RegionalOffice {
  id: string;
  slug: string;
  regionId: string;
  mapLabel: string;
  officeName: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  directionsLabel: string;
  directionsUrl: string;
  mapImageAlt: string;
  imageUrl: string;
  previewUrl: string;
  imageFile: File | null;
  lat: number | null;
  lng: number | null;
}

interface RegionalMapImage {
  field: string;
  url: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions = new Subscription();

  eyebrow = 'Regional Map';
  title = 'Regional Map';

  navigation = {
    previousLabel: 'Previous',
    nextLabel: 'Next',
    counterFormat: '01 / 03',
  };

  mapImageAlt = 'Telangana regional district map';
  mapImageUrl = '';
  mapImagePreview = '';
  mapImageFile: File | null = null;

  offices: RegionalOffice[] = [];

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditMode = false;

  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadRegionalMap();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearAllPreviews();
  }

  private defaultOffices(): RegionalOffice[] {
    return [
      {
        id: 'hyderabad-head-office',
        slug: 'hyderabad-head-office',
        regionId: 'hyderabad',
        mapLabel: 'Hyderabad',
        officeName: 'TGSCO Head Office, Hyderabad',
        address: 'Nampally, Hyderabad, Telangana 500001',
        phone: '+91 40 2323 XXXX',
        email: 'info@tgsco.telangana.gov.in',
        hours: 'Mon-Sat, 10:00 AM - 6:00 PM',
        directionsLabel: 'Get Direction',
        directionsUrl:
          'https://maps.google.com/?q=TGSCO+Head+Office+Hyderabad',
        mapImageAlt: 'TGSCO Head Office, Hyderabad',
        imageUrl: '',
        previewUrl: '',
        imageFile: null,
        lat: null,
        lng: null,
      },
      {
        id: 'khammam-regional-office',
        slug: 'khammam-regional-office',
        regionId: 'khammam',
        mapLabel: 'Khammam',
        officeName: 'TGSCO Regional Office, Khammam',
        address: 'Regional Office, Khammam, Telangana 507001',
        phone: '+91 40 2323 1111',
        email: 'khammam@tgsco.telangana.gov.in',
        hours: 'Mon-Sat, 10:00 AM - 6:00 PM',
        directionsLabel: 'Get Direction',
        directionsUrl: 'https://maps.google.com/?q=Khammam+Telangana',
        mapImageAlt: 'TGSCO Regional Office, Khammam',
        imageUrl: '',
        previewUrl: '',
        imageFile: null,
        lat: null,
        lng: null,
      },
      {
        id: 'medak-regional-office',
        slug: 'medak-regional-office',
        regionId: 'medak',
        mapLabel: 'Medak',
        officeName: 'TGSCO Regional Office, Medak',
        address: 'Main Road, Medak, Telangana 502110',
        phone: '+91 40 2323 2222',
        email: 'medak@tgsco.telangana.gov.in',
        hours: 'Mon-Sat, 10:00 AM - 6:00 PM',
        directionsLabel: 'Get Direction',
        directionsUrl: 'https://maps.google.com/?q=Medak+Telangana',
        mapImageAlt: 'TGSCO Regional Office, Medak',
        imageUrl: '',
        previewUrl: '',
        imageFile: null,
        lat: null,
        lng: null,
      },
    ];
  }

  private defaultOffice(index: number): RegionalOffice {
    return {
      id: `regional-office-${index + 1}`,
      slug: `regional-office-${index + 1}`,
      regionId: `region-${index + 1}`,
      mapLabel: '',
      officeName: '',
      address: '',
      phone: '',
      email: '',
      hours: '',
      directionsLabel: 'Get Direction',
      directionsUrl: '',
      mapImageAlt: '',
      imageUrl: '',
      previewUrl: '',
      imageFile: null,
      lat: null,
      lng: null,
    };
  }

  private clearPreview(url: string): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private clearAllPreviews(): void {
    this.clearPreview(this.mapImagePreview);

    this.offices.forEach((office) => {
      this.clearPreview(office.previewUrl);
    });
  }

  private parseContent(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }

    return value && typeof value === 'object' ? value : {};
  }

  private extractResponse(response: any): {
    data: any;
    content: any;
    images: RegionalMapImage[];
  } {
    const data = response?.data ?? response;
    const content = this.parseContent(data?.content ?? data);

    return {
      data,
      content,
      images: Array.isArray(data?.images) ? data.images : [],
    };
  }

  private getImageUrl(
    images: RegionalMapImage[],
    field: string,
  ): string {
    if (!field) {
      return '';
    }

    return images.find((image) => image.field === field)?.url ?? '';
  }

  private getOfficeImageField(
    regionIndex: number,
    locationIndex: number,
  ): string {
    return `regions[${regionIndex}].locations[${locationIndex}].image`;
  }

  private normalizeOffice(
    region: any,
    location: any,
    regionIndex: number,
    locationIndex: number,
    images: RegionalMapImage[],
  ): RegionalOffice {
    const imageField = this.getOfficeImageField(
      regionIndex,
      locationIndex,
    );

    const imageUrl =
      this.getImageUrl(images, imageField) ||
      (typeof location?.image === 'string' &&
      location.image.startsWith('http')
        ? location.image
        : '');

    return {
      id: location?.id ?? '',
      slug: location?.slug ?? location?.id ?? '',
      regionId: region?.regionId ?? '',
      mapLabel: region?.regionName ?? '',
      officeName: location?.title ?? '',
      address: location?.address ?? '',
      phone: location?.phone ?? '',
      email: location?.email ?? '',
      hours: location?.timing ?? '',
      directionsLabel: 'Get Direction',
      directionsUrl: location?.directionUrl ?? '',
      mapImageAlt: location?.imageAlt ?? location?.title ?? '',
      imageUrl,
      previewUrl: imageUrl,
      imageFile: null,
      lat:
        location?.lat !== undefined && location?.lat !== null
          ? Number(location.lat)
          : null,
      lng:
        location?.lng !== undefined && location?.lng !== null
          ? Number(location.lng)
          : null,
    };
  }

  loadRegionalMap(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.add(
      this.api
        .getRegionalMap()
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: (response: any) => {
            const { data, content, images } =
              this.extractResponse(response);

            this.clearAllPreviews();

            this.eyebrow = content?.eyebrow ?? 'Regional Map';
            this.title = content?.title ?? 'Regional Map';

            this.navigation = {
              previousLabel:
                content?.navigation?.previousLabel ?? 'Previous',
              nextLabel:
                content?.navigation?.nextLabel ?? 'Next',
              counterFormat:
                content?.navigation?.counterFormat ?? '01 / 03',
            };

            this.mapImageAlt =
              content?.mapImageAlt ??
              'Telangana regional district map';

            this.mapImageUrl =
              this.getImageUrl(images, 'mapImage') ||
              content?.mapImageUrl ||
              content?.mapImage ||
              '';

            this.mapImagePreview = this.mapImageUrl;
            this.mapImageFile = null;

            const receivedRegions = Array.isArray(content?.regions)
              ? content.regions
              : [];

            const receivedLocations: RegionalOffice[] = [];

            receivedRegions.forEach(
              (region: any, regionIndex: number) => {
                const locations = Array.isArray(region?.locations)
                  ? region.locations
                  : [];

                locations.forEach(
                  (location: any, locationIndex: number) => {
                    receivedLocations.push(
                      this.normalizeOffice(
                        region,
                        location,
                        regionIndex,
                        locationIndex,
                        images,
                      ),
                    );
                  },
                );
              },
            );

            this.offices = receivedLocations.length
              ? receivedLocations
              : this.defaultOffices();

            this.isEditMode = !!data?.id;

            this.cdr.markForCheck();
          },
          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ??
              'Unable to load Regional Map content.';

            this.cdr.markForCheck();
          },
        }),
    );
  }

  loadOffice(index: number): void {
    const office = this.offices[index];

    if (!office?.id.trim()) {
      this.errorMessage =
        'Enter an office ID before fetching its details.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api
        .getRegionalMapItem(office.id.trim())
        .pipe(
          timeout(60000),
          finalize(() => {
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: (response: any) => {
            const { content, images } =
              this.extractResponse(response);

            const location = content?.location ?? content;
            const region = content?.region ?? {};

            if (!location) {
              this.errorMessage = 'No office details were returned.';
              return;
            }

            const current = this.offices[index];

            const imageUrl =
              this.getImageUrl(
                images,
                location?.imageField ?? '',
              ) ||
              (typeof location?.image === 'string' &&
              location.image.startsWith('http')
                ? location.image
                : '');

            this.clearPreview(current.previewUrl);

            this.offices[index] = {
              ...current,
              id: location?.id ?? current.id,
              slug: location?.slug ?? current.slug,
              regionId: region?.regionId ?? current.regionId,
              mapLabel: region?.regionName ?? current.mapLabel,
              officeName: location?.title ?? current.officeName,
              address: location?.address ?? current.address,
              phone: location?.phone ?? current.phone,
              email: location?.email ?? current.email,
              hours: location?.timing ?? current.hours,
              directionsUrl:
                location?.directionUrl ?? current.directionsUrl,
              imageUrl: imageUrl || current.imageUrl,
              previewUrl: imageUrl || current.previewUrl,
              imageFile: null,
              lat: location?.lat ?? current.lat,
              lng: location?.lng ?? current.lng,
            };

            this.successMessage = 'Office details loaded.';
            this.cdr.markForCheck();
          },
          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ??
              'Unable to load this regional office.';

            this.cdr.markForCheck();
          },
        }),
    );
  }

  onMapImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid map image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'The map image must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.clearPreview(this.mapImagePreview);

    this.mapImageFile = file;
    this.mapImagePreview = URL.createObjectURL(file);
    this.errorMessage = '';

    this.cdr.markForCheck();
  }

  onOfficeImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid office image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Each office image must not exceed 5 MB.';
      input.value = '';
      return;
    }

    const office = this.offices[index];

    this.clearPreview(office.previewUrl);

    office.imageFile = file;
    office.previewUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  addOffice(): void {
    this.offices.push(this.defaultOffice(this.offices.length));
    this.cdr.markForCheck();
  }

  removeOffice(index: number): void {
    if (
      !confirm('Remove this office from the regional map content?')
    ) {
      return;
    }

    this.clearPreview(this.offices[index].previewUrl);
    this.offices.splice(index, 1);

    this.cdr.markForCheck();
  }

  private buildRegions(): any[] {
    const regions: any[] = [];

    this.offices.forEach((office) => {
      let region = regions.find(
        (item) => item.regionId === office.regionId,
      );

      if (!region) {
        region = {
          regionId: office.regionId.trim(),
          regionName: office.mapLabel.trim(),
          locations: [],
        };

        regions.push(region);
      }

      region.locations.push({
        id: office.id.trim(),
        title: office.officeName.trim(),
        lat: office.lat,
        lng: office.lng,
        image: `regions[${regions.length - 1}].locations[${region.locations.length}].image`,
        imageAlt: office.mapImageAlt.trim(),
        address: office.address.trim(),
        phone: office.phone.trim(),
        email: office.email.trim(),
        timing: office.hours.trim(),
        directionUrl: office.directionsUrl.trim(),
      });
    });

    return regions;
  }

  saveRegionalMap(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.eyebrow.trim()) {
      this.errorMessage = 'Please enter the eyebrow text.';
      return;
    }

    if (this.offices.length === 0) {
      this.errorMessage = 'Add at least one regional office.';
      return;
    }

    for (const office of this.offices) {
      if (
        !office.id.trim() ||
        !office.regionId.trim() ||
        !office.mapLabel.trim() ||
        !office.officeName.trim() ||
        !office.address.trim()
      ) {
        this.errorMessage =
          'Each office must have a region ID, region name, office ID, office name, and address.';
        return;
      }

      if (
        (office.lat !== null && !Number.isFinite(office.lat)) ||
        (office.lng !== null && !Number.isFinite(office.lng))
      ) {
        this.errorMessage =
          'Please enter valid latitude and longitude values.';
        return;
      }
    }

    const content = {
      eyebrow: this.eyebrow.trim(),
      regions: this.buildRegions(),
    };

    /*
     * The existing API method accepts Record<number, File>.
     * This maps the first location image in each region to its region index.
     * If the API service supports arbitrary multipart field paths, its
     * parameter type and FormData mapping must be updated for multiple
     * location images in the same region.
     */
    const itemImages: Record<number, File> = {};

    const regions = content.regions;

    regions.forEach((region, regionIndex) => {
      const firstOffice = this.offices.find(
        (office) => office.regionId === region.regionId,
      );

      if (firstOffice?.imageFile) {
        itemImages[regionIndex] = firstOffice.imageFile;
      }
    });

    this.isSaving = true;

    const request = this.isEditMode
      ? this.api.updateRegionalMap(content, itemImages)
      : this.api.createRegionalMap(content, itemImages);

    this.subscriptions.add(
      request
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isSaving = false;
            this.api.scrollToTop();
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: () => {
            this.successMessage = this.isEditMode
              ? 'Regional Map updated successfully.'
              : 'Regional Map created successfully.';

            this.loadRegionalMap();
            this.cdr.markForCheck();
          },
          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ??
              'Unable to save Regional Map content.';

            this.cdr.markForCheck();
          },
        }),
    );
  }

  deleteRegionalMap(): void {
    if (!this.isEditMode) {
      return;
    }

    if (
      !confirm(
        'Are you sure you want to delete the entire Regional Map content?',
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api
        .deleteRegionalMap()
        .pipe(
          timeout(60000),
          finalize(() => {
            this.isDeleting = false;
            this.api.scrollToTop();
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: () => {
            this.clearAllPreviews();

            this.eyebrow = 'Regional Map';
            this.title = 'Regional Map';

            this.navigation = {
              previousLabel: 'Previous',
              nextLabel: 'Next',
              counterFormat: '01 / 03',
            };

            this.mapImageAlt = 'Telangana regional district map';
            this.mapImageUrl = '';
            this.mapImagePreview = '';
            this.mapImageFile = null;

            this.offices = this.defaultOffices();
            this.isEditMode = false;

            this.successMessage =
              'Regional Map content deleted successfully.';

            this.cdr.markForCheck();
          },
          error: (error: any) => {
            this.errorMessage =
              error?.error?.message ??
              'Unable to delete Regional Map content.';

            this.cdr.markForCheck();
          },
        }),
    );
  }

  resetForm(): void {
    if (
      confirm('Discard unsaved changes and reload Regional Map content?')
    ) {
      this.loadRegionalMap();
    }
  }
}
