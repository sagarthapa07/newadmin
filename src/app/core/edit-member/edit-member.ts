import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../Services/api';
import { AlertMessage } from "../../shared/component/alert-message/alert-message";
import { DatePipe } from '@angular/common';
import { pipe } from 'rxjs';
import { Header } from "../../shared/component/header/header";


@Component({
  selector: 'app-edit-member',
  standalone: true,
  imports: [ReactiveFormsModule, AlertMessage, DatePipe, Header],
  templateUrl: './edit-member.html',
  styleUrls: ['./edit-member.scss'],
})
export class EditMemberComponent implements OnInit {
  memberForm!: FormGroup;

  memberId!: number;

  invoices: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: Api
  ) {}

  ngOnInit(): void {
    this.memberForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      country: [''],
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

    this.loadMember();
    this.loadInvoices();
  }

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
      },
    });
  }

  loadInvoices() {
    this.api.getMemberInvoices(this.memberId).subscribe({
      next: (res) => {
        this.invoices = res.invoice || [];
      },
    });
  }

  onSave() {
    console.log(this.memberForm.value);
  }
}