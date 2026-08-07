import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/component/header/header';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';

@Component({
  selector: 'app-business-plans-add',
  imports: [CommonModule, ReactiveFormsModule, Header, AlertMessage],
  templateUrl: './business-plans-add.html',
  styleUrl: './business-plans-add.scss',
})
export class BusinessPlansAdd implements OnInit {
  planForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isSaving = false;
  planIndex = 0;
  planTypeOptions = ['Developing Countries', 'Country Specific', 'All Countries'];
  planExpiryOptions = ['Autometic', 'Never Expire'];
  durationUnitOptions = ['Day', 'Month', 'Year'];
  currencyOptions = ['INR', 'USD', 'EURO', 'POUND', 'YEN'];
  statusOptions = ['Draft', 'Active', 'Inactive'];
  trialPlanDaysOptions = ['3 Days', '5 Days', '7 Days'];
  paymentMethodOptions: { id: number; label: string }[] = [];
  loadingPaymentMethods = false;

  showPaymentDropdown = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: Api,
    private auth: Auth,
    private http: HttpClient,
  ) {
    this.planForm = this.fb.group(
      {
        planName: ['', Validators.required],
        planCode: ['', Validators.required],
        planAmount: ['', [Validators.required, Validators.min(0)]],
        planCurrency: ['', Validators.required],
        duration: ['', [Validators.required, Validators.min(1)]],
        durationUnit: ['', Validators.required],
        planType: ['', Validators.required],
        planExpiry: ['', Validators.required],
        validFrom: ['', Validators.required],
        validTo: ['', Validators.required],
        status: ['', Validators.required],
        planRemark: [''],
        use14DaysTrial: [false],
        trialPlanDays: [''],
        monthlyPlan: [false],
        autoRenewalPlan: [false],
        paymentMethods: [[] as number[]],
      },
      { validators: this.dateRangeValidator },
    );
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.planForm.get('use14DaysTrial')?.valueChanges.subscribe((checked: boolean) => {
      const trialControl = this.planForm.get('trialPlanDays');
      if (checked) {
        trialControl?.setValidators([Validators.required]);
      } else {
        trialControl?.clearValidators();
        trialControl?.setValue('');
      }
      trialControl?.updateValueAndValidity();
    });
  }

  loadPaymentMethods(): void {
    this.loadingPaymentMethods = true;

    this.api.getPaymentMethods().subscribe({
      next: (res: any) => {
        this.loadingPaymentMethods = false;

        const list = res?.result || [];

        this.paymentMethodOptions = list.map((item: any) => ({
          id: item.index,
          label: item.name,
        }));
      },
      error: (err) => {
        this.loadingPaymentMethods = false;
        console.error('Payment methods load failed', err);
        this.errorMessage = 'Payment methods load nahi ho paye';
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.multiselect-wrapper')) {
      this.showPaymentDropdown = false;
    }
  }

  dateRangeValidator(group: FormGroup) {
    const validFrom = group.get('validFrom')?.value;
    const validTo = group.get('validTo')?.value;
    if (!validFrom || !validTo) return null;
    return new Date(validFrom) <= new Date(validTo) ? null : { dateRangeInvalid: true };
  }

  getClientIP() {
    return this.http.get<any>('https://api.ipify.org?format=json');
  }

  getUserMail(): string {
    const user = this.auth.getUser();
    return user?.emailId || '';
  }

  getUserId(): number {
    const user = this.auth.getUser();
    return user?.userIndex || 0;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.planForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  togglePaymentDropdown(): void {
    this.showPaymentDropdown = !this.showPaymentDropdown;
  }

  isPaymentMethodSelected(id: number): boolean {
    const selected: number[] = this.planForm.get('paymentMethods')?.value || [];
    return selected.includes(id);
  }

  togglePaymentMethod(id: number): void {
    const control = this.planForm.get('paymentMethods');
    const selected: number[] = control?.value || [];

    if (selected.includes(id)) {
      control?.setValue(selected.filter((m) => m !== id));
    } else {
      control?.setValue([...selected, id]);
    }
  }

  get paymentMethodsDisplayText(): string {
    const selected: number[] = this.planForm.get('paymentMethods')?.value || [];
    if (this.loadingPaymentMethods) return 'Loading...';
    if (!selected.length) return 'Select payment methods...';

    const labels = this.paymentMethodOptions
      .filter((m) => selected.includes(m.id))
      .map((m) => m.label);

    return labels.join(', ');
  }

  onCancel(): void {
    this.router.navigate(['/masters/plans']);
  }

  onSave(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const form = this.planForm.value;
    const userMail = this.getUserMail();
    const userId = this.getUserId();

    this.getClientIP().subscribe({
      next: (ipRes: any) => {
        this.savePlan(form, userId, userMail, ipRes?.ip || '');
      },
      error: () => {
        this.savePlan(form, userId, userMail, '');
      },
    });
  }

  private savePlan(form: any, userId: number, userMail: string, clientIP: string) {
    this.isSaving = true;

    const payload = {
      plan: {
        planIndex: this.planIndex,
        planName: form.planName,
        planCode: form.planCode,
        planAmount: form.planAmount,
        planCurrency: form.planCurrency,
        duration: form.duration,
        durationUnit: form.durationUnit,
        planType: form.planType,
        planExpiry: form.planExpiry,
        validFrom: form.validFrom,
        validTo: form.validTo,
        trialPlan: form.use14DaysTrial ? 'YES' : 'NO',
        monthlyPlan: form.monthlyPlan ? 'YES' : 'NO',
        autoRenewalPlan: form.autoRenewalPlan ? 'YES' : 'NO',
        status: form.status,
        countryIndex: 0,
        planRemark: form.planRemark,
        trialDays: form.use14DaysTrial ? parseInt(form.trialPlanDays, 10) || 0 : 0,
      },
      planPaymentMethods: form.paymentMethods,
      userId: userId,
      userMail: userMail,
      clientIP: clientIP,
    };
    this.api.addUpdatePlanRecord(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        if (res.successCode === 1) {
          this.successMessage = 'Business plan created successfully';

          const newPlanIndex =
            typeof res.result === 'number'
              ? res.result
              : (res.result?.planIndex ?? res.planIndex ?? res.result?.id ?? res.id);

          if (newPlanIndex) {
            this.router.navigate(['/business-plans/edit', newPlanIndex]);
          } else {
            console.warn('New plan ID API response mein nahi mila:', res);
            this.router.navigate(['/business-plans']);
          }
        } else {
          this.errorMessage = 'Plan creation failed';
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.errorMessage = 'Plan creation failed';
      },
    });
  }
  get selectedPaymentMethods(): { id: number; label: string }[] {
    const selected: number[] = this.planForm.get('paymentMethods')?.value || [];
    return this.paymentMethodOptions.filter((m) => selected.includes(m.id));
  }

  removePaymentMethod(id: number, event: MouseEvent): void {
    event.stopPropagation(); // dropdown open na ho jab chip ka x click ho
    const control = this.planForm.get('paymentMethods');
    const selected: number[] = control?.value || [];
    control?.setValue(selected.filter((m) => m !== id));
  }
}
