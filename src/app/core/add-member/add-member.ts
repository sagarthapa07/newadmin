import { Component } from '@angular/core';
import { Api } from '../Services/api';
import { Router } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-add-member',
  imports: [Header, ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-member.html',
  styleUrl: './add-member.scss',
})
export class AddMember {
  memberForm!: FormGroup;

  states: any[] = [];
  plans: any[] = [];
  invoices: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: Api,
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
        console.log('States Response = ', res);

        this.states = res.states || res.result || [];
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  loadPlans() {
    this.api.getAllPlans().subscribe({
      next: (res: any) => {
        console.log('Plans Response = ', res);
        this.plans = res.result || [];
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  onSave() {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }
    console.log(this.memberForm.value);
  }
}
