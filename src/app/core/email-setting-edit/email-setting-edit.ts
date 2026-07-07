import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/component/header/header';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';

@Component({
  selector: 'app-email-setting-edit',
  imports: [CommonModule, ReactiveFormsModule, Header, AlertMessage],
  templateUrl: './email-setting-edit.html',
  styleUrl: './email-setting-edit.scss',
})
export class EmailSettingEdit {
  emailIndex: number | null = null;
  settingForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
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

  ngOnInit() {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.emailIndex = Number(idFromRoute);
      this.loadSetting(this.emailIndex);
    }
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
  loadSetting(id: number) {
    this.isLoading = true;
    const userMail = this.getUserMail();
    const userId = this.getUserId();

    this.api
      .getAllEmailSettings({ pageIndex: 1, pageSize: 100, userId, userMail, clientIP: '' })
      .subscribe({
        next: (res: any) => {
          const list = res.settings || [];
          const found = list.find((x: any) => x.emailIndex === id);
          if (found) {
            this.fillForm(found);
          } else {
            this.errorMessage = 'Email setting not found';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to load email setting';
          this.isLoading = false;
        },
      });
  }

  fillForm(data: any) {
    this.settingForm.patchValue({
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      senderPassword: data.senderPassword,
      mailServer: data.mailServer,
      smtpport: data.smtpport,
      enableSsl: data.enableSsl,
    });
  }

  onCancel() {
    this.router.navigate(['/email-setting']);
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
    const payload: any = {
      emailIndex: this.emailIndex || 0,
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

    console.log('Payload sent to API:', payload);

    this.api.addUpdateEmailSetting(payload).subscribe({
      next: (res: any) => {
        if (res.successCode === 1) {
          this.successMessage = 'Email setting updated successfully';
        } else {
          this.errorMessage = 'Update failed';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Update failed';
      },
    });
  }
}
