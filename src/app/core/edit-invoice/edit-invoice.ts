import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../Services/api';
import { Header } from '../../shared/component/header/header';
import { ReactiveFormsModule } from '@angular/forms';

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

  activeTab = 'invoice-details';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: Api,
  ) {}

  ngOnInit(): void {
    this.memberId = Number(this.route.snapshot.paramMap.get('memberId'));
    this.invoiceId = Number(this.route.snapshot.paramMap.get('invoiceId'));

    this.initForms();
    this.loadStates();
    this.loadPlans();
    this.loadPaymentMethods();
    this.loadMember();
    this.loadInvoice();
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
      selectedPlan: [''],
      planAmount: [''],
      couponCode: [''],
      discountType: [''],
      discountAmount: [''],
      amountAfterDiscount: [''],
      discountRemark: [''],
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
      discountValue: [''],
      afterDiscountAmount: [''],
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
  }

  loadMember() {
    this.api.getMemberById(this.memberId).subscribe({
      next: (res: any) => {
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

        this.country = [
          {
            country: m.country,
          },
        ];

        this.memberForm.patchValue({
          country: m.country,
        });

        this.invoiceForm.patchValue({
          plan: m.plan,
        });
      },
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + ' UTC');
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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
        console.log(this.invoiceForm.value);
      },
    });
  }

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

  saveInvoice() {
    const form = this.invoiceForm.value;

    const payload = {
      userIndex: 5,
      userEmail: 'admin@gmail.com',
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

    console.log(payload);

    this.api.addUpdateInvoice(payload).subscribe({
      next: (res: any) => {
        console.log(res);
        alert('Invoice Updated Successfully');
      },

      error: (err) => {
        console.log(err);
      },
    });
  }

  saveMember() {
    const form = this.memberForm.value;

    const payload = {
      userIndex: 5,
      userEmail: 'ritu@fundsforngos.org',
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
      next: (res: any) => {
        console.log(res);

        alert('Member Updated Successfully');
      },

      error: (err) => {
        console.log(err);
      },
    });
  }
}
