import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../Services/api';
import { Header } from '../../shared/component/header/header';

@Component({
  selector: 'app-edit-member',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './edit-member.html',
  styleUrls: ['./edit-member.scss'],
})
export class EditMemberComponent implements OnInit {
  memberForm!: FormGroup;
  states: any[] = [];
  plans: any[] = [];
  memberId!: number;
  invoices: any[] = [];
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: Api,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.memberForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      country: [''],
      countryId: [''],
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

    this.memberId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadStates();
    this.loadMember();
    this.loadInvoices();
    this.loadPlans();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  loadPlans() {
    this.api.getAllPlans().subscribe({
      next: (res: any) => {
        this.plans = res.result || [];
      },
    });
  }
  loadMember() {
    this.api.getMemberById(this.memberId).subscribe({
      next: (res) => {
        const m = res.registeredmember;

        this.memberForm.patchValue({
          firstName: m.firstName,
          lastName: m.lastName,
          country: m.country,
          countryId: m.countryId,
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
      },
    });
  }
  openInvoice(invoiceId: number) {
    this.router.navigate(['/premium-members/edit-invoice', this.memberId, invoiceId]);
  }

  loadStates() {
    this.api.getAllStates().subscribe({
      next: (res: any) => {
        this.states = res.states || res.data || [];
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  loadInvoices() {
    this.api.getMemberInvoices(this.memberId).subscribe({
      next: (res: any) => {
        console.log('Invoices Response', res);

        this.invoices = res.invoice || res.result || [];
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  onSave() {
    const f = this.memberForm.value;

    const payload = {
      userIndex: 5,
      userEmail: 'ritu@fundsforngos.org',
      memberId: this.memberId,
      memberType: '',
      firstName: f.firstName,
      lastName: f.lastName,
      country: f.country,
      countryId: f.countryId,
      state: f.state,
      zipCode: f.zipCode,
      city: f.city,
      billingAddress: f.billingAddress,
      remarks: f.remarks,
      plan: f.plan,
      planId: this.getPlanId(f.plan),
      email: f.email,
      password: f.password,
      contactNo: f.contactNo,
      memberStatus: f.memberStatus,
      registrationDate: f.registrationDate ? new Date(f.registrationDate).toISOString() : null,
      activationDate: f.activationDate ? new Date(f.activationDate).toISOString() : null,
    };

    console.log(payload);

    this.api.addUpdateMember(payload).subscribe({
      next: (res: any) => {
        console.log('Saved Successfully', res);
      },

      error: (err) => {
        console.log(err);
      },
    });
  }

  getPlanId(planName: string): number {
    const plan = this.plans.find((x: any) => x.name === planName);

    return plan ? plan.index : 0;
  }
  gotoCancel() {
    this.router.navigate(['/premium-members/memberModule']);
  }
}