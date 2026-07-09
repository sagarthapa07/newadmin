import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import { Header } from '../../shared/component/header/header';

@Component({
  standalone: true,
  selector: 'app-edit-invoice',
  imports: [Header, ReactiveFormsModule],
  templateUrl: './edit-invoice.html',
  styleUrl: './edit-invoice.scss',
})
export class EditInvoice {
  memberForm!: FormGroup;
  invoiceForm!: FormGroup;

  memberId!: number;
  invoiceId!: number;

  states: any[] = [];
  country: any[] = [];
  plans: any[] = [];
  paymentMethods: any[] = [];

  tabs = ['invoice-details', 'discount', 'invoice', 'misc', 'transaction'];
  activeTab = 'invoice-details';

  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: Api,
    private auth: Auth,
  ) {}

  ngOnInit(): void {
    this.memberId = Number(this.route.snapshot.paramMap.get('memberId'));
    this.invoiceId = Number(this.route.snapshot.paramMap.get('invoiceId'));

    this.initForms();
    this.loadStates();
    this.loadPlans();
    this.loadPaymentMethods();
    this.loadMember();

    if (this.invoiceId) {
      this.loadInvoice();
    }

    this.memberForm.disable();
  }

  initForms() {
    this.memberForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      country: ['United States'],
      state: [''],
      zipCode: [''],
      city: [''],
      billingAddress: [''],
      remarks: [''],
      plan: [''],
      email: [''],
      password: [''],
      contactNo: [''],
      memberStatus: [''],
      registrationDate: [''],
      activationDate: [''],
    });

    this.invoiceForm = this.fb.group({
      plan: [''],
      planAmount: [''],
      couponCode: [''],
      discountType: [''],
      discountAmount: [''],
      discountRemark: [''],
      afterDiscountAmount: [''],
      planActivationDate: [''],
      planDuration: [''],
      planDurationUnit: [''],
      planExpiryDate: [''],
      extendedExpiryDate: [''],
      validityRemark: [''],
      invoiceNumber: [''],
      invoiceDate: [''],
      invoiceStatus: [''],
      currency: [''],
      netInvoiceAmount: [''],
      netTaxableAmount: [''],
      paymentMode: [''],
      paymentMethodIndex: [''],
      payerEmail: [''],
      transactionId: [''],
      paymentId: [''],
      transactionDate: [''],
      remarkForInvoice: [''],
      miscAdd: [''],
      remarkForMiscAdd: [''],
      miscLess: [''],
      remarkForMiscLess: [''],
      transactionAmount: [''],
      transactionStatus: [''],
      transactionRemark: [''],
      recieptAttachment: [''],
      sendEmail: [false],
    });
    // 👆 discountValue aur amountAfterDiscount hataye — HTML mein kahin bind nahi the, dead controls the
  }

  // ---------- Edit mode toggle ----------
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.memberForm.enable();
    } else {
      this.memberForm.disable();
      this.loadMember();
    }
  }

  // ---------- Common: current logged-in user ----------
  private getUserContext() {
    return {
      userIndex: this.auth.getUser()?.userIndex || 0,
      userEmail: this.auth.getUser()?.emailId || '',
    };
  }

  // ---------- Member ----------
  loadMember() {
    this.api.getMemberById(this.memberId).subscribe({
      next: (res) => {
        const m = res.registeredmember;

        this.memberForm.patchValue({
          firstName: m.firstName,
          lastName: m.lastName,
          country: m.country,
          state: m.state,
          zipCode: m.zipCode,
          city: m.city,
          billingAddress: m.billingAddress,
          remarks: m.remarks,
          plan: m.plan,
          email: m.email,
          password: m.password,
          contactNo: m.contactNo,
          memberStatus: m.memberStatus,
          registrationDate: m.registrationDate?.split('T')[0],
          activationDate: m.activationDate?.split('T')[0],
        });

        this.country = [{ country: m.country }];   // dropdown ke options ke liye

        if (this.invoiceId) {
          this.invoiceForm.patchValue({ plan: m.plan });
        }
      },
    });
  }

  saveMember() {
    const form = this.memberForm.value;
    const { userIndex, userEmail } = this.getUserContext();

    const payload = {
      userIndex,
      userEmail,
      memberId: this.memberId,
      memberType: '',
      firstName: form.firstName,
      lastName: form.lastName,
      country: form.country,
      countryId: 230,
      state: form.state,
      zipCode: form.zipCode,
      city: form.city,
      billingAddress: form.billingAddress,
      remarks: form.remarks,
      plan: form.plan,
      planId: 1,
      email: form.email,
      password: form.password,
      contactNo: form.contactNo,
      memberStatus: form.memberStatus,
      registrationDate: form.registrationDate,
      activationDate: form.activationDate,
    };

    this.api.addUpdateMember(payload).subscribe({
      next: () => {
        this.isEditMode = false;
        this.memberForm.disable();
      },
      error: (err) => console.error('Member save failed', err),
    });
  }

  // ---------- Invoice ----------
  loadInvoice() {
    this.api.getInvoiceById(this.invoiceId).subscribe({
      next: (res: any) => {
        const inv = res.invoice;
        this.invoiceForm.patchValue({
          planAmount: inv.planAmount,
          planDuration: inv.planDuration,
          planDurationUnit: inv.planDurationUnit,

          planActivationDate: this.formatDate(inv.planActivationDate),
          planExpiryDate: this.formatDate(inv.planExpiryDate),
          extendedExpiryDate: this.formatDate(inv.extendedExpiryDate),
          invoiceDate: this.formatDate(inv.invoiceDate),
          transactionDate: this.formatDate(inv.transactionDate),

          validityRemark: inv.validityRemark || '-',
          invoiceNumber: inv.invoiceNumber,
          invoiceStatus: inv.invStatus,
          currency: inv.currency,
          netInvoiceAmount: inv.netInvoiceAmount,
          netTaxableAmount: inv.netTaxableAmount,
          paymentMode: inv.paymentMode,
          payerEmail: inv.payerEmail,
          paymentId: inv.paymentId,
          transactionId: inv.transactionId,
          remarkForInvoice: inv.remarkForInvoice || '-',
          couponCode: inv.couponCode,
          discountType: inv.discountType === '-' ? '' : inv.discountType,
          discountAmount: inv.discountValue,
          afterDiscountAmount: inv.afterDiscountAmount,
          discountRemark: inv.discountRemark,
          miscAdd: inv.miscAdd,
          remarkForMiscAdd: inv.remarkForMiscAdd,
          miscLess: inv.miscLess,
          remarkForMiscLess: inv.remarkForMiscLess,
          transactionAmount: inv.transactionAmount,
          transactionStatus: inv.transactionStatus,
          transactionRemark: inv.transactionRemark,
          recieptAttachment: inv.recieptAttachment,
        });
      },
    });
  }

  onPlanChange(event: Event): void {
    const planName = (event.target as HTMLSelectElement).value;
    const selectedPlan = this.plans.find((p: any) => p.name === planName);
    if (!selectedPlan) return;

    this.api.getPlanByPlanIndex(selectedPlan.index).subscribe({
      next: (res: any) => {
        if (res.successCode === 1 && res.result?.plan) {
          this.fillInvoiceFromPlan(res.result.plan);
        }
      },
      error: (err) => console.error('Failed to load plan details', err),
    });
  }

  private fillInvoiceFromPlan(plan: any): void {
    const today = this.getTodayFormatted();
    const expiryStr = this.formatDate(this.addDuration(new Date(), plan.duration, plan.durationUnit).toString());

    this.invoiceForm.patchValue({
      planAmount: plan.planAmount,
      planActivationDate: today,
      planDuration: plan.duration,
      planDurationUnit: plan.durationUnit,
      planExpiryDate: expiryStr,
      extendedExpiryDate: expiryStr,
      validityRemark: plan.planRemark,

      couponCode: '',
      discountType: '',
      discountAmount: '',
      afterDiscountAmount: plan.planAmount,
      discountRemark: '',

      invoiceNumber: '',
      invoiceDate: today,

      miscAdd: '',
      remarkForMiscAdd: '',
      miscLess: '',
      remarkForMiscLess: '',
      netTaxableAmount: plan.planAmount,
      currency: plan.planCurrency,
      remarkForInvoice: '',

      netInvoiceAmount: plan.planAmount,
      transactionDate: today,
      paymentMode: '',
      payerEmail: '',
      paymentId: '',
      transactionId: '',
      transactionAmount: plan.planAmount,
      transactionStatus: '',
      transactionRemark: '',
      recieptAttachment: '',
      sendEmail: false,
    });
  }

  saveInvoice() {
    const form = this.invoiceForm.value;
    const { userIndex, userEmail } = this.getUserContext();

    const payload = {
      userIndex,
      userEmail,
      invoiceIndex: this.invoiceId,
      memberIndex: this.memberId,
      invoiceDate: form.invoiceDate,
      planName: form.plan,
      planIndex: 1,
      planAmount: form.planAmount,
      planActivationDate: form.planActivationDate,
      planDuration: form.planDuration,
      planDurationUnit: form.planDurationUnit,
      planExpiryDate: form.planExpiryDate,
      extendedExpiryDate: form.extendedExpiryDate,
      validityRemark: form.validityRemark,
      couponCode: form.couponCode,
      discountType: form.discountType,
      discountValue: form.discountAmount,
      discountRemark: form.discountRemark,
      miscAdd: form.miscAdd,
      remarkForMiscAdd: form.remarkForMiscAdd,
      miscLess: form.miscLess,
      remarkForMiscLess: form.remarkForMiscLess,
      netTaxableAmount: form.netTaxableAmount,
      currency: form.currency,
      remarkForInvoice: form.remarkForInvoice,
      netInvoiceAmount: form.netInvoiceAmount,
      transactionDate: form.transactionDate,
      paymentMode: form.paymentMode,
      paymentMethodIndex: form.paymentMethodIndex,
      paymentMethodCode: '',
      payerEmail: form.payerEmail,
      paymentId: form.paymentId,
      transactionId: form.transactionId,
      transactionAmount: form.transactionAmount,
      transactionStatus: form.transactionStatus,
      transactionRemark: form.transactionRemark,
      recieptAttachment: form.recieptAttachment,
      isSendEmail: form.sendEmail ? 1 : 0,
    };

    this.api.addUpdateInvoice(payload).subscribe({
      next: () => {
        // TODO: successMessage / AlertMessage se replace karo alert() ki jagah
      },
      error: (err) => console.error('Invoice save failed', err),
    });
  }

  // ---------- Date helpers (common, reused everywhere) ----------
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + ' UTC');
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTodayFormatted(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDuration(date: Date, duration: number, unit: string): Date {
    const result = new Date(date);
    switch (unit) {
      case 'Year':
        result.setFullYear(result.getFullYear() + duration);
        break;
      case 'Month':
        result.setMonth(result.getMonth() + duration);
        break;
      case 'day':
      case 'Day':
        result.setDate(result.getDate() + duration);
        break;
    }
    return result;
  }

  // ---------- Dropdown data ----------
  loadStates() {
    this.api.getAllStates().subscribe({
      next: (res: any) => {
        this.states = res.states || res.result || [];
      },
    });
  }

  loadPlans() {
    this.api.getAllPlans().subscribe({
      next: (res: any) => {
        this.plans = res.result || [];
      },
    });
  }

  loadPaymentMethods() {
    this.api.getPaymentMethods().subscribe({
      next: (res: any) => {
        this.paymentMethods = res.result || [];
      },
    });
  }

  // ---------- Tabs navigation ----------
  get activeTabIndex(): number {
    return this.tabs.indexOf(this.activeTab);
  }

  get isFirstTab(): boolean {
    return this.activeTabIndex === 0;
  }

  get isLastTab(): boolean {
    return this.activeTabIndex === this.tabs.length - 1;
  }

  goToNextTab(): void {
    if (!this.isLastTab) {
      this.activeTab = this.tabs[this.activeTabIndex + 1];
    }
  }

  goToPrevTab(): void {
    if (!this.isFirstTab) {
      this.activeTab = this.tabs[this.activeTabIndex - 1];
    }
  }
}