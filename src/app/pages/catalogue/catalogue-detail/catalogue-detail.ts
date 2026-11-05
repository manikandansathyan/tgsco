
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

type Section = 'groups' | 'categories' | 'products';

@Component({
  selector: 'app-catalogue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogue-detail.html',
  styleUrl: './catalogue-detail.css',
})
export class CatalogueDetail implements OnInit, OnDestroy {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions = new Subscription();

  section: Section = 'groups';
  categoryType = '';

  items: any[] = [];
  filteredItems: any[] = [];

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  statusFilter = 'all';

  showForm = false;
  showDetails = false;
  isEditing = false;
  selectedItem: any = null;
  selectedId = '';

  imageFile: File | null = null;
  mainImageFile: File | null = null;
  galleryFiles: File[] = [];

  imagePreview = '';
  mainImagePreview = '';
  galleryPreviews: string[] = [];

  form: any = {};

  private readonly emptyForm = {
    name: '',
    slug: '',
    description: '',
    subtitle: '',
    groupId: '',
    sortOrder: 0,
    active: true,
    type: '',
    sku: '',
    categorySlug: '',
    shortDescription: '',
    price: 0,
    originalPrice: 0,
    discountPercent: 0,
    currency: 'INR',
    stockQuantity: 0,
    overview: '',
    craftStory: '',
    materialCare: '',
    shippingReturns: '',
    categorySlugsText: '[]',
    categoryIdsText: '[]',
    typesText: '[]',
    attributesText: '{}',
    bulkPricingText: '[]',
  };

  ngOnInit(): void {
    this.form = { ...this.emptyForm };

    this.subscriptions.add(
      this.route.data.subscribe((data) => {
        const section = data['section'];

        if (
          section === 'groups' ||
          section === 'categories' ||
          section === 'products'
        ) {
          this.section = section;
        }

        this.cdr.markForCheck();
      }),
    );

    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        this.categoryType = params.get('type') || '';
        this.loadData();
      }),
    );

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        if (params.get('action') === 'create' && !this.showForm) {
          this.openCreateForm();
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearPreviews();
  }

  get pageTitle(): string {
    if (this.section === 'groups') {
      return 'Catalogue Groups';
    }

    if (this.section === 'categories') {
      return this.categoryType
        ? `${this.formatLabel(this.categoryType)} Categories`
        : 'Catalogue Categories';
    }

    return 'Catalogue Products';
  }

  get pageDescription(): string {
    if (this.section === 'groups') {
      return 'Create and manage catalogue groups.';
    }

    if (this.section === 'categories') {
      return 'Organize catalogue products into categories.';
    }

    return 'Manage product details, pricing, images, and stock.';
  }

  get formTitle(): string {
    const recordType =
      this.section === 'groups'
        ? 'Group'
        : this.section === 'categories'
          ? 'Category'
          : 'Product';

    return `${this.isEditing ? 'Edit' : 'Create'} ${recordType}`;
  }

  private formatLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private extractItems(response: any): any[] {
    const candidates = [
      response?.data?.groups,
      response?.data?.categories,
      response?.data?.products,
      response?.data?.items,
      response?.groups,
      response?.categories,
      response?.products,
      response?.items,
      response?.data,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    let request;

    if (this.section === 'groups') {
      request = this.api.getCatalogueGroupsAPI();
    } else if (this.section === 'categories') {
      request = this.api.getCatalogueCategoriesAPI(
        this.categoryType || undefined,
      );
    } else {
      request = this.api.getCatalogueProductsAPI();
    }

    this.subscriptions.add(
      request
        .pipe(
          timeout(60000),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: (response: any) => {
            this.items = this.extractItems(response);
            this.applyFilters();
            this.cdr.markForCheck();
          },
          error: (error: any) => {
            console.error('Catalogue data API error:', error);

            this.items = [];
            this.filteredItems = [];

            this.errorMessage =
              error?.error?.message ||
              (error?.name === 'TimeoutError'
                ? 'The request timed out. Please try again.'
                : 'Unable to load catalogue data.');

            this.cdr.markForCheck();
          },
        }),
    );
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredItems = this.items.filter((item) => {
      const matchesSearch =
        !search ||
        [
          item?.name,
          item?.title,
          item?.slug,
          item?.sku,
          item?.description,
          item?.shortDescription,
        ].some((value) =>
          String(value || '').toLowerCase().includes(search),
        );

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && item?.active !== false) ||
        (this.statusFilter === 'inactive' && item?.active === false);

      return matchesSearch && matchesStatus;
    });

    this.cdr.markForCheck();
  }

  getId(item: any): string {
    return String(item?._id || item?.id || '');
  }

  getName(item: any): string {
    return item?.name || item?.title || 'Untitled';
  }

  getItemType(item: any): string {
    return item?.type || item?.category?.name || item?.categorySlug || '—';
  }

  getPrice(item: any): string {
    if (item?.price === undefined || item?.price === null) {
      return '—';
    }

    return `${item?.currency || 'INR'} ${item.price}`;
  }

  getImageUrl(image: any): string {
    if (!image) {
      return '';
    }

    if (typeof image === 'string') {
      return image;
    }

    return image?.url || image?.imageUrl || '';
  }

  getGalleryImageUrls(item: any): string[] {
    if (!Array.isArray(item?.galleryImages)) {
      return [];
    }

    return item.galleryImages
      .map((image: any) => this.getImageUrl(image))
      .filter((url: string) => !!url);
  }

  // Returns category names for the product details modal.
  getCategoryNames(item: any): string {
    if (Array.isArray(item?.categories) && item.categories.length) {
      return item.categories
        .map((category: any) => {
          if (typeof category === 'string') {
            return category;
          }

          return category?.name || category?.slug || '';
        })
        .filter(Boolean)
        .join(', ') || item?.categorySlug || '—';
    }

    return item?.categorySlug || '—';
  }

  openCreateForm(): void {
    this.resetForm();

    this.isEditing = false;
    this.selectedId = '';
    this.selectedItem = null;
    this.showDetails = false;
    this.showForm = true;

    if (this.section === 'categories' && this.categoryType) {
      this.form.type = this.categoryType;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.cdr.markForCheck();
  }

  editItem(item: any): void {
    this.selectedItem = item;
    this.selectedId = this.getId(item);
    this.isEditing = true;
    this.showDetails = false;
    this.showForm = true;

    this.clearPreviews();

    const itemCategories = Array.isArray(item?.categories)
      ? item.categories
      : [];

    const categorySlugs =
      Array.isArray(item?.categorySlugs) && item.categorySlugs.length
        ? item.categorySlugs
        : itemCategories
            .map((category: any) =>
              typeof category === 'string' ? category : category?.slug,
            )
            .filter(Boolean);

    const categoryIds =
      Array.isArray(item?.categoryIds) && item.categoryIds.length
        ? item.categoryIds
        : itemCategories
            .map((category: any) =>
              typeof category === 'string'
                ? ''
                : category?._id || category?.id,
            )
            .filter(Boolean);

    this.form = {
      ...this.emptyForm,
      ...item,

      groupId:
        item?.groupId?._id ||
        item?.groupId?.id ||
        item?.groupId ||
        item?.group ||
        '',

      categorySlug:
        item?.categorySlug ||
        item?.category?.slug ||
        itemCategories.find((category: any) =>
          typeof category === 'object',
        )?.slug ||
        '',

      categorySlugsText: JSON.stringify(categorySlugs, null, 2),
      categoryIdsText: JSON.stringify(categoryIds, null, 2),
      typesText: JSON.stringify(item?.types || [], null, 2),
      attributesText: JSON.stringify(item?.attributes || {}, null, 2),
      bulkPricingText: JSON.stringify(item?.bulkPricing || [], null, 2),

      active: item?.active !== false,
    };

    this.imageFile = null;
    this.mainImageFile = null;
    this.galleryFiles = [];

    this.imagePreview = this.getImageUrl(item?.image) || item?.imageUrl || '';

    this.mainImagePreview =
      this.getImageUrl(item?.mainImage) || item?.mainImageUrl || '';

    this.galleryPreviews = this.getGalleryImageUrls(item);

    this.cdr.markForCheck();
  }

  viewItem(item: any): void {
    this.selectedItem = item;
    this.showForm = false;
    this.showDetails = true;
    this.cdr.markForCheck();
  }

  closeForm(): void {
    this.showForm = false;
    this.clearPreviews();

    this.imageFile = null;
    this.mainImageFile = null;
    this.galleryFiles = [];

    this.cdr.markForCheck();
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedItem = null;
    this.cdr.markForCheck();
  }

  private resetForm(): void {
    this.form = { ...this.emptyForm };

    this.imageFile = null;
    this.mainImageFile = null;
    this.galleryFiles = [];

    this.clearPreviews();

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();
  }

  onImageSelected(event: Event, field: 'image' | 'mainImage'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must not exceed 5 MB.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';

    if (field === 'image') {
      if (this.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(this.imagePreview);
      }

      this.imageFile = file;
      this.imagePreview = URL.createObjectURL(file);
    } else {
      if (this.mainImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(this.mainImagePreview);
      }

      this.mainImageFile = file;
      this.mainImagePreview = URL.createObjectURL(file);
    }

    this.cdr.markForCheck();
  }

  onGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.some((file) => !file.type.startsWith('image/'))) {
      this.errorMessage = 'Please select image files only.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      this.errorMessage = 'Each image must not exceed 5 MB.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.galleryPreviews.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    this.errorMessage = '';
    this.galleryFiles = files;
    this.galleryPreviews = [
      ...this.getGalleryImageUrls(this.selectedItem),
      ...files.map((file) => URL.createObjectURL(file)),
    ];

    this.cdr.markForCheck();
  }

  private parseJson(value: string, fallback: any, label: string): any {
    try {
      return value.trim() ? JSON.parse(value) : fallback;
    } catch {
      throw new Error(`${label} must contain valid JSON.`);
    }
  }

  private buildPayload(): any {
    const payload: any = { ...this.form };

    delete payload.categorySlugsText;
    delete payload.categoryIdsText;
    delete payload.typesText;
    delete payload.attributesText;
    delete payload.bulkPricingText;

    if (this.section === 'groups') {
      delete payload.type;
      delete payload.sku;
      delete payload.categorySlug;
      delete payload.shortDescription;
      delete payload.price;
      delete payload.originalPrice;
      delete payload.discountPercent;
      delete payload.currency;
      delete payload.stockQuantity;
      delete payload.overview;
      delete payload.craftStory;
      delete payload.materialCare;
      delete payload.shippingReturns;
      delete payload.groupId;
    }

    if (this.section === 'categories') {
      payload.group = payload.groupId || '';

      delete payload.groupId;
      delete payload.sortOrder;
      delete payload.sku;
      delete payload.categorySlug;
      delete payload.shortDescription;
      delete payload.price;
      delete payload.originalPrice;
      delete payload.discountPercent;
      delete payload.currency;
      delete payload.stockQuantity;
      delete payload.overview;
      delete payload.craftStory;
      delete payload.materialCare;
      delete payload.shippingReturns;
    }

    if (this.section === 'products') {
      delete payload.subtitle;
      delete payload.groupId;
      delete payload.sortOrder;
      delete payload.image;
      delete payload.group;

      payload.categorySlugs = this.parseJson(
        this.form.categorySlugsText || '[]',
        [],
        'Category slugs',
      );

      payload.categoryIds = this.parseJson(
        this.form.categoryIdsText || '[]',
        [],
        'Category IDs',
      );

      payload.types = this.parseJson(
        this.form.typesText || '[]',
        [],
        'Types',
      );

      payload.attributes = this.parseJson(
        this.form.attributesText || '{}',
        {},
        'Attributes',
      );

      payload.bulkPricing = this.parseJson(
        this.form.bulkPricingText || '[]',
        [],
        'Bulk pricing',
      );
    }

    if (this.section === 'groups' || this.section === 'categories') {
      payload.image = this.imageFile || undefined;
    } else {
      payload.mainImage = this.mainImageFile || undefined;
      payload.galleryImages = this.galleryFiles;
    }

    return payload;
  }

  saveItem(): void {
    if (this.saving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.form.name?.trim()) {
      this.errorMessage = 'Name is required.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.form.slug?.trim()) {
      this.errorMessage = 'Slug is required.';
      this.cdr.markForCheck();
      return;
    }

    let payload: any;

    try {
      payload = this.buildPayload();
    } catch (error: any) {
      this.errorMessage =
        error?.message || 'Please check the JSON fields.';
      this.cdr.markForCheck();
      return;
    }

    if (
      this.section === 'products' &&
      !this.isEditing &&
      !this.mainImageFile
    ) {
      this.errorMessage = 'Please select a main product image.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    let request;

    if (this.section === 'groups') {
      request =
        this.isEditing && this.selectedId
          ? this.api.updateCatalogueGroupAPI(this.selectedId, payload)
          : this.api.createCatalogueGroupAPI(payload);
    } else if (this.section === 'categories') {
      request =
        this.isEditing && this.selectedId
          ? this.api.updateCatalogueCategoryAPI(this.selectedId, payload)
          : this.api.createCatalogueCategoryAPI(payload);
    } else {
      request =
        this.isEditing && this.selectedId
          ? this.api.updateCatalogueProductAPI(this.selectedId, payload)
          : this.api.createCatalogueProductAPI(payload);
    }

    const wasEditing = this.isEditing;
    const savedSection = this.section;

    this.subscriptions.add(
      request
        .pipe(
          timeout(60000),
          finalize(() => {
            this.saving = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: () => {
            this.showForm = false;

            const recordType =
              savedSection === 'groups'
                ? 'Group'
                : savedSection === 'categories'
                  ? 'Category'
                  : 'Product';

            this.successMessage = `${recordType} ${
              wasEditing ? 'updated' : 'created'
            } successfully.`;

            this.clearPreviews();

            this.imageFile = null;
            this.mainImageFile = null;
            this.galleryFiles = [];

            this.loadData();
            this.cdr.markForCheck();
          },
          error: (error: any) => {
            console.error('Catalogue save API error:', error);

            this.errorMessage =
              error?.error?.message ||
              (error?.name === 'TimeoutError'
                ? 'The save request timed out. Please try again.'
                : 'Unable to save the catalogue record.');

            this.cdr.markForCheck();
          },
        }),
    );
  }

  deleteItem(item: any): void {
    const id = this.getId(item);

    if (!id) {
      this.errorMessage = 'Unable to identify this record.';
      this.cdr.markForCheck();
      return;
    }

    if (!confirm(`Delete "${this.getName(item)}"? This cannot be undone.`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.markForCheck();

    let request;

    if (this.section === 'groups') {
      request = this.api.deleteCatalogueGroupAPI(id);
    } else if (this.section === 'categories') {
      request = this.api.deleteCatalogueCategoryAPI(id);
    } else {
      request = this.api.deleteCatalogueProductAPI(id);
    }

    this.subscriptions.add(
      request
        .pipe(
          timeout(60000),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: () => {
            this.successMessage = 'Record deleted successfully.';
            this.loadData();
            this.cdr.markForCheck();
          },
          error: (error: any) => {
            console.error('Catalogue delete API error:', error);

            this.errorMessage =
              error?.error?.message ||
              (error?.name === 'TimeoutError'
                ? 'The delete request timed out. Please try again.'
                : 'Unable to delete this record.');

            this.cdr.markForCheck();
          },
        }),
    );
  }

  goBack(): void {
    this.router.navigate(['/catalogue']);
  }

  private clearPreviews(): void {
    const urls = [
      this.imagePreview,
      this.mainImagePreview,
      ...this.galleryPreviews,
    ];

    urls.forEach((url) => {
      if (url?.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    this.imagePreview = '';
    this.mainImagePreview = '';
    this.galleryPreviews = [];
  }
}
