
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/services/api';
import { finalize, timeout } from 'rxjs';

type SettingsTab =
  | 'general'
  | 'invoice'
  | 'shipping'
  | 'packing'
  | 'charges';

type RuleType = 'shipping' | 'packing' | 'charges';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  activeTab: SettingsTab = 'general';

  loading = false;
  saving = false;

  private pendingLoads = 0;

  errorMessage = '';
  successMessage = '';

  generalSettings: any = {};
  metadata: any = {};

  invoiceSettings: any = this.getDefaultInvoice();

  shippingRules: any[] = [];
  packingRules: any[] = [];
  charges: any[] = [];

  editingRule = false;
  editingIndex = -1;

  ruleForm: any = this.getDefaultRule('shipping');

  ngOnInit(): void {
    this.loadGeneralSettings();
    this.loadInvoiceSettings();
    this.loadShippingSettings();
    this.loadPackingSettings();
  }

  // ==========================================
  // TABS
  // ==========================================

  get tabs(): { id: SettingsTab; label: string }[] {
    return [
      { id: 'general', label: 'General' },
      { id: 'invoice', label: 'Invoice' },
      { id: 'shipping', label: 'Shipping' },
      { id: 'packing', label: 'Packing' },
      { id: 'charges', label: 'Additional Charges' },
    ];
  }

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
    this.clearMessages();

    switch (tab) {
      case 'general':
        this.loadGeneralSettings();
        break;

      case 'invoice':
        this.loadInvoiceSettings();
        break;

      case 'shipping':
        this.loadShippingSettings();
        break;

      case 'packing':
        this.loadPackingSettings();
        break;

      case 'charges':
        this.loadChargesSettings();
        break;
    }
  }

  // ==========================================
  // DEFAULT SETTINGS
  // ==========================================

  private getDefaultInvoice(): any {
    return {
      legalBusinessName: '',
      displayBusinessName: '',

      sellerAddress: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },

      gstin: '',
      pan: '',

      contact: {
        phone: '',
        email: '',
      },

      invoicePrefix: '',
      financialYear: '',
      nextSequence: 1,

      terms: '',
      returnsPolicy: '',

      signatory: {
        name: '',
        designation: '',
      },

      bankDetails: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifsc: '',
      },

      active: true,
    };
  }

  getDefaultRule(type: RuleType): any {
    return {
      type,

      code:
        type === 'shipping'
          ? 'shipping-standard'
          : type === 'packing'
            ? 'packing-standard'
            : 'cod',

      name:
        type === 'shipping'
          ? 'Standard shipping'
          : type === 'packing'
            ? 'Standard packing'
            : 'Cash on delivery',

      method: type === 'charges' ? 'flat' : 'percentage',

      amount: type === 'charges' ? 40 : 0,

      percentage:
        type === 'shipping'
          ? 3.5
          : type === 'packing'
            ? 1.5
            : 0,

      freeAbove:
        type === 'shipping'
          ? 2500
          : type === 'packing'
            ? 5000
            : 10000,

      taxable: type === 'shipping',

      taxRate: type === 'shipping' ? 18 : 0,

      active: true,

      conditionsText: JSON.stringify(
        type === 'shipping'
          ? {
              serviceLevel: 'standard',
              appliesTo: 'all',
            }
          : type === 'packing'
            ? {
                packaging: 'standard',
                appliesTo: 'all',
              }
            : {
                paymentMethod: 'cod',
                appliesTo: 'all',
              },
        null,
        2
      ),
    };
  }

  // ==========================================
  // RESPONSE HELPERS
  // ==========================================

  private unwrap(response: any): any {
    return response?.data ?? response?.settings ?? response ?? {};
  }

  private extractList(response: any, keys: string[] = []): any[] {
    const data = this.unwrap(response);

    if (Array.isArray(data)) {
      return data;
    }

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    for (const key of keys) {
      if (Array.isArray(data?.data?.[key])) {
        return data.data[key];
      }
    }

    if (
      data &&
      typeof data === 'object' &&
      (data.code || data.name)
    ) {
      return [data];
    }

    return [];
  }

  private getRuleId(rule: any): string | null {
    const id = rule?._id ?? rule?.id ?? rule?.ruleId;

    return id ? String(id) : null;
  }

  private getErrorMessage(error: any): string {
    return (
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      'Something went wrong. Please try again.'
    );
  }

  // ==========================================
  // LOADING HELPERS
  // ==========================================

  private startLoading(): void {
    this.pendingLoads++;
    this.loading = true;
  }

  private finishLoading(): void {
    this.pendingLoads = Math.max(0, this.pendingLoads - 1);
    this.loading = this.pendingLoads > 0;

    this.cdr.markForCheck();
  }

  private handleLoadError(error: any): void {
    this.errorMessage = this.getErrorMessage(error);
  }

  private handleSaveError(error: any): void {
    this.errorMessage = this.getErrorMessage(error);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ==========================================
  // GENERAL SETTINGS
  // ==========================================

  loadGeneralSettings(): void {
    this.startLoading();

    this.api
      .getSettings()
      .pipe(
        timeout(60000),
        finalize(() => this.finishLoading())
      )
      .subscribe({
        next: (response: any) => {
          const data = this.unwrap(response);

          this.generalSettings = data || {};

          // Aggregate invoice settings
          const invoiceData = Array.isArray(data?.invoice)
            ? data.invoice[0]
            : data?.invoice;

          if (invoiceData && typeof invoiceData === 'object') {
            this.invoiceSettings = this.mergeInvoiceSettings(invoiceData);
          }

          // Aggregate additional charges
          this.charges = Array.isArray(data?.charges)
            ? data.charges
            : [];

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleLoadError(error);
        },
      });

    this.startLoading();

    this.api
      .getSettingsMetadata()
      .pipe(
        timeout(60000),
        finalize(() => this.finishLoading())
      )
      .subscribe({
        next: (response: any) => {
          this.metadata = this.unwrap(response) || {};
          this.cdr.markForCheck();
        },

        error: () => {
          this.metadata = {};
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // INVOICE SETTINGS
  // ==========================================

  private mergeInvoiceSettings(data: any): any {
    const defaults = this.getDefaultInvoice();

    return {
      ...defaults,
      ...data,

      sellerAddress: {
        ...defaults.sellerAddress,
        ...(data?.sellerAddress || {}),
      },

      contact: {
        ...defaults.contact,
        ...(data?.contact || {}),
      },

      signatory: {
        ...defaults.signatory,
        ...(data?.signatory || {}),
      },

      bankDetails: {
        ...defaults.bankDetails,
        ...(data?.bankDetails || {}),
      },
    };
  }

  loadInvoiceSettings(): void {
    this.startLoading();

    this.api
      .getInvoiceSettings()
      .pipe(
        timeout(60000),
        finalize(() => this.finishLoading())
      )
      .subscribe({
        next: (response: any) => {
          const data = this.unwrap(response);

          // API can return an empty array when no invoice exists
          const invoice = Array.isArray(data)
            ? data[0] || null
            : data;

          this.invoiceSettings = invoice
            ? this.mergeInvoiceSettings(invoice)
            : this.getDefaultInvoice();

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleLoadError(error);
        },
      });
  }

  saveInvoiceSettings(): void {
    this.clearMessages();

    if (!this.invoiceSettings.legalBusinessName?.trim()) {
      this.errorMessage = 'Legal business name is required.';
      return;
    }

    if (!this.invoiceSettings.sellerAddress?.line1?.trim()) {
      this.errorMessage = 'Seller address line 1 is required.';
      return;
    }

    const payload = {
      ...this.invoiceSettings,

      nextSequence: Number(this.invoiceSettings.nextSequence) || 1,

      sellerAddress: {
        ...this.invoiceSettings.sellerAddress,
      },

      contact: {
        ...this.invoiceSettings.contact,
      },

      signatory: {
        ...this.invoiceSettings.signatory,
      },

      bankDetails: {
        ...this.invoiceSettings.bankDetails,
      },
    };

    this.saving = true;

    this.api
      .updateInvoiceSettings(payload)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = this.unwrap(response);

          const invoice = Array.isArray(data)
            ? data[0]
            : data;

          if (invoice && typeof invoice === 'object') {
            this.invoiceSettings = this.mergeInvoiceSettings(invoice);
          }

          this.successMessage = 'Invoice settings saved successfully.';
          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleSaveError(error);
        },
      });
  }

  // ==========================================
  // SHIPPING SETTINGS
  // ==========================================

  loadShippingSettings(): void {
    this.startLoading();

    this.api
      .getShippingSettings()
      .pipe(
        timeout(60000),
        finalize(() => this.finishLoading())
      )
      .subscribe({
        next: (response: any) => {
          this.shippingRules = this.extractList(response, [
            'shipping',
            'shippingRules',
            'rules',
            'items',
          ]);

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleLoadError(error);
        },
      });
  }

  // ==========================================
  // PACKING SETTINGS
  // ==========================================

  loadPackingSettings(): void {
    this.startLoading();

    this.api
      .getPackingSettings()
      .pipe(
        timeout(60000),
        finalize(() => this.finishLoading())
      )
      .subscribe({
        next: (response: any) => {
          this.packingRules = this.extractList(response, [
            'packing',
            'packingRules',
            'rules',
            'items',
          ]);

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleLoadError(error);
        },
      });
  }

  // ==========================================
  // ADDITIONAL CHARGES
  // ==========================================

  loadChargesSettings(): void {
    this.startLoading();

    this.api
      .getSettings()
      .pipe(
        timeout(60000),
        finalize(() => this.finishLoading())
      )
      .subscribe({
        next: (response: any) => {
          const data = this.unwrap(response);

          this.charges = Array.isArray(data?.charges)
            ? data.charges
            : [];

          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleLoadError(error);
        },
      });
  }

  // ==========================================
  // CURRENT RULES
  // ==========================================

  get currentRules(): any[] {
    switch (this.activeTab) {
      case 'shipping':
        return this.shippingRules;

      case 'packing':
        return this.packingRules;

      case 'charges':
        return this.charges;

      default:
        return [];
    }
  }

  get currentRuleType(): RuleType {
    switch (this.activeTab) {
      case 'packing':
        return 'packing';

      case 'charges':
        return 'charges';

      default:
        return 'shipping';
    }
  }

  // ==========================================
  // CREATE / EDIT RULE
  // ==========================================

  openCreateRule(): void {
    this.clearMessages();

    this.editingRule = false;
    this.editingIndex = -1;

    this.ruleForm = this.getDefaultRule(this.currentRuleType);
  }

  openEditRule(rule: any, index: number): void {
    this.clearMessages();

    this.editingRule = true;
    this.editingIndex = index;

    this.ruleForm = {
      ...this.getDefaultRule(this.currentRuleType),
      ...rule,

      conditionsText: JSON.stringify(
        rule?.conditions ?? {},
        null,
        2
      ),
    };
  }

  cancelRuleForm(): void {
    this.editingRule = false;
    this.editingIndex = -1;

    this.ruleForm = this.getDefaultRule(this.currentRuleType);
  }

  // ==========================================
  // SAVE RULE
  // ==========================================

  saveRule(): void {
    this.clearMessages();

    let conditions: any;

    try {
      conditions = JSON.parse(
        this.ruleForm.conditionsText || '{}'
      );

      if (
        conditions === null ||
        typeof conditions !== 'object' ||
        Array.isArray(conditions)
      ) {
        this.errorMessage = 'Conditions must be a valid JSON object.';
        return;
      }
    } catch {
      this.errorMessage = 'Conditions must contain valid JSON.';
      return;
    }

    const payload = {
      type: this.currentRuleType,

      code: this.ruleForm.code?.trim(),
      name: this.ruleForm.name?.trim(),

      method: this.ruleForm.method,

      amount: Number(this.ruleForm.amount) || 0,
      percentage: Number(this.ruleForm.percentage) || 0,
      freeAbove: Number(this.ruleForm.freeAbove) || 0,

      taxable: Boolean(this.ruleForm.taxable),
      taxRate: Number(this.ruleForm.taxRate) || 0,

      active: Boolean(this.ruleForm.active),

      conditions,
    };

    if (!payload.code || !payload.name) {
      this.errorMessage = 'Code and name are required.';
      return;
    }

    const ruleId = this.editingRule
      ? this.getRuleId(this.currentRules[this.editingIndex])
      : null;

    if (this.editingRule && !ruleId) {
      this.errorMessage =
        'Cannot update this rule because its ID is missing.';
      return;
    }

    this.saving = true;

    const api: any = this.api;

    let request: any;

    if (this.editingRule) {
      switch (this.currentRuleType) {
        case 'shipping':
          request = api.updateShippingSetting(ruleId, payload);
          break;

        case 'packing':
          request = api.updatePackingSetting(ruleId, payload);
          break;

        case 'charges':
          request = api.updateSettingCharge(ruleId, payload);
          break;
      }
    } else {
      switch (this.currentRuleType) {
        case 'shipping':
          request = this.api.createShippingSetting(payload);
          break;

        case 'packing':
          request = this.api.createPackingSetting(payload);
          break;

        case 'charges':
          request = this.api.createSettingCharge(payload);
          break;
      }
    }

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const savedData = this.unwrap(response);

          const savedRule = Array.isArray(savedData)
            ? savedData[0]
            : savedData;

          const rule = {
            ...payload,
            ...(savedRule && typeof savedRule === 'object'
              ? savedRule
              : {}),
          };

          const list = this.currentRules;

          if (this.editingRule && this.editingIndex >= 0) {
            list[this.editingIndex] = rule;
          } else {
            list.push(rule);
          }

          this.updateRuleLists();

          this.successMessage = this.editingRule
            ? 'Setting updated successfully.'
            : 'Setting created successfully.';

          this.cancelRuleForm();
          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleSaveError(error);
        },
      });
  }

  // ==========================================
  // DELETE RULE
  // ==========================================

  deleteRule(rule: any, index: number): void {
    const confirmed = window.confirm(
      `Delete "${rule?.name || rule?.code || 'this setting'}"?`
    );

    if (!confirmed) {
      return;
    }

    const ruleId = this.getRuleId(rule);

    if (!ruleId) {
      this.errorMessage =
        'Cannot delete this setting because its ID is missing.';
      return;
    }

    this.clearMessages();
    this.saving = true;

    const api: any = this.api;

    let request: any;

    switch (this.currentRuleType) {
      case 'shipping':
        request = api.deleteShippingSetting(ruleId);
        break;

      case 'packing':
        request = api.deletePackingSetting(ruleId);
        break;

      case 'charges':
        request = api.deleteSettingCharge(ruleId);
        break;
    }

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.currentRules.splice(index, 1);

          this.updateRuleLists();

          this.successMessage = 'Setting deleted successfully.';
          this.cdr.markForCheck();
        },

        error: (error: any) => {
          this.handleSaveError(error);
        },
      });
  }

  private updateRuleLists(): void {
    this.shippingRules = [...this.shippingRules];
    this.packingRules = [...this.packingRules];
    this.charges = [...this.charges];
  }

  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^./, (letter) => letter.toUpperCase());
  }

  objectEntries(
    value: any
  ): { key: string; value: any }[] {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return [];
    }

    return Object.entries(value).map(([key, item]) => ({
      key,
      value: item,
    }));
  }

  displayValue(value: any): string {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
}
