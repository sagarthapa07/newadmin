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
    });
  }

  loadMember() {
    this.api.getMemberById(this.memberId).subscribe({
      next: (res: any) => {
        console.log('Member API Response =', res);
        console.log('plan name =', res.plan);

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
        this.invoiceForm.patchValue({
          plan: m.planName,
        });
        console.log('Member Plan Name:', m.planName);
      },
    });
  }

  loadInvoice() {
    this.api.getMemberInvoices(this.memberId).subscribe({
      next: (res: any) => {
        console.log('Invoice Response:', res);
        const inv = res.invoice?.find((x: any) => x.invoiceIndex == this.invoiceId);
        console.log('Selected Invoice:', inv);
        console.log('inv.planIndex =', inv?.planIndex);
        console.log('inv.planName =', inv?.planName);

        if (!inv) return;

        this.invoiceForm.patchValue({
          plan: inv.planName,
          planAmount: inv.planAmount,
          planActivationDate: inv.planActivationDate?.split('T')[0],
          planDuration: inv.planDuration,
          planDurationUnit: inv.planDurationUnit,
          planExpiryDate: inv.planExpiryDate?.split('T')[0],
          extendedExpiryDate: inv.extendedExpiryDate?.split('T')[0],
          validityRemark: inv.validityRemark || '-',

          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate?.split('T')[0],
          invoiceStatus: inv.invoiceStatus,
          currency: inv.currency,
          netInvoiceAmount: inv.netInvoiceAmount,
          netTaxableAmount: inv.netTaxableAmount,

          paymentMode: inv.paymentMode,
          paymentMethodIndex: inv.paymentMethodIndex,
          payerEmail: inv.payerEmail,
          paymentId: inv.paymentId,
          transactionId: inv.transactionId,
          transactionDate: inv.transactionDate?.split('T')[0],
          remarkForInvoice: inv.remarkForInvoice || '-',
        });
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
        this.plans.forEach((plan: any) => {});
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
    console.log(this.invoiceForm.value);
  }

  saveMember() {
    console.log(this.memberForm.value);
  }
}
