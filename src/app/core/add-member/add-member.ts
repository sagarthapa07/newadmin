import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import { Router } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule, Header, ReactiveFormsModule, AlertMessage],   // NgSelectModule hataya
  templateUrl: './add-member.html',
  styleUrl: './add-member.scss',
})
export class AddMember {
  memberForm!: FormGroup;
  successMessage = '';
  errorMessage = '';
  isSaving = false;

  states: any[] = [];
  plans: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private auth: Auth,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadStates();
    this.loadPlans();
  }

  initForm() {
    this.memberForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      city: ['', Validators.required],
      billingAddress: ['', Validators.required],
      remarks: ['', Validators.required],
      plan: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      contactNo: ['', Validators.required],
      memberStatus: ['', Validators.required],
      registrationDate: ['', Validators.required],
      activationDate: ['', Validators.required],
    });
  }

  loadStates() {
    this.api.getAllStates().subscribe({
      next: (res: any) => {
        this.states = res.states || res.result || [];
      },
      error: (err) => {
        console.error('Failed to load states', err);
      },
    });
  }

  loadPlans() {
    this.api.getAllPlans().subscribe({
      next: (res: any) => {
        this.plans = res.result || [];
      },
      error: (err) => {
        console.error('Failed to load plans', err);
      },
    });
  }

  getUserMail(): string {
    return this.auth.getUser()?.emailId || '';
  }

  getUserId(): number {
    return this.auth.getUser()?.userIndex || 0;
  }

  onCancel() {
    this.router.navigate(['/premium-members/memberModule']);
  }

  onSave() {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const form = this.memberForm.value;

    const payload: any = {
      ...form,
      userId: this.getUserId(),
      userMail: this.getUserMail(),
    };

    // ⚠️ Api service mein addUpdateMember (ya jo bhi naam ho) method call karna padega yahan
    this.api.addUpdateMember(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.successCode === 1) {
          this.successMessage = 'Member saved successfully';
          setTimeout(() => this.router.navigate(['/members']), 1000);
        } else {
          this.errorMessage = 'Member save failed';
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.errorMessage = 'Member save failed';
      },
    });
  }
}