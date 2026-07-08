import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/component/header/header';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';

@Component({
  selector: 'app-email-setting-add',
  imports: [CommonModule, ReactiveFormsModule, Header, AlertMessage],
  templateUrl: './email-setting-add.html',
  styleUrl: './email-setting-add.scss',
})
export class EmailSettingAdd {
  settingForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api,
    private auth: Auth,
    private http: HttpClient,
  ) {
    this.settingForm = this.fb.group({
      senderName: ['', Validators.required],
      senderEmail: ['', [Validators.required, Validators.email]],
      senderPassword: ['', Validators.required],
      mailServer: ['', Validators.required],
      smtpport: ['', Validators.required],
      enableSsl: ['True', Validators.required],
    });
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
    const control = this.settingForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onCancel() {
    this.router.navigate(['/masters/email-settings']);
  }

  onSave() {
    if (this.settingForm.invalid) {
      this.settingForm.markAllAsTouched();
      return;
    }

    const form = this.settingForm.value;
    const userMail = this.getUserMail();
    const userId = this.getUserId();

    this.getClientIP().subscribe({
      next: (ipRes: any) => {
        this.saveSetting(form, userId, userMail, ipRes?.ip || '');
      },
      error: () => {
        this.saveSetting(form, userId, userMail, '');
      },
    });
  }

  private saveSetting(form: any, userId: number, userMail: string, clientIP: string) {
    this.isSaving = true;

    const payload: any = {
      emailIndex: 0,
      senderName: form.senderName,
      senderEmail: form.senderEmail,
      senderPassword: form.senderPassword,
      smtpport: form.smtpport,
      mailServer: form.mailServer,
      enableSsl: form.enableSsl,
      userId: userId,
      userMail: userMail,
      clientIP: clientIP,
    };

    this.api.addUpdateEmailSetting(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        if (res.successCode === 1) {
          this.successMessage = 'Email setting created successfully';
          setTimeout(() => {
            this.router.navigate(['/email-setting']);
          }, 1000);
        } else {
          this.errorMessage = 'Email setting creation failed';
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.errorMessage = 'Email setting creation failed';
      },
    });
  }
}