import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Editor } from '../../shared/component/editor/editor';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import { Header } from '../../shared/component/header/header';

@Component({
  selector: 'app-email-templates-add',
  imports: [CommonModule, ReactiveFormsModule, Editor, AlertMessage, Header],
  templateUrl: './email-templates-add.html',
  styleUrl: './email-templates-add.scss',
})
export class EmailTemplatesAdd {
  templateForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isSaving = false;
  emailSettingsList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api,
    private auth: Auth,
    private http: HttpClient,
  ) {
    this.templateForm = this.fb.group({
      templateInfo: ['', Validators.required],
      emailIndex: ['', Validators.required],
      applicabletags: [''],
      emailHeader: ['', Validators.required],
      recipientType: ['', Validators.required],
      emailModule: ['', Validators.required],
      templateString: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadEmailSettings();
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
    const control = this.templateForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isEditorEmpty(): boolean {
    const control = this.templateForm.get('templateString');
    const value = control?.value || '';
    const plainText = value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim();
    return !plainText && !!(control?.dirty || control?.touched);
  }
  showEditorError(): boolean {
    const control = this.templateForm.get('templateString');
    return this.isEditorEmpty() && !!(control?.dirty || control?.touched);
  }

  loadEmailSettings() {
    const userMail = this.getUserMail();
    const userId = this.getUserId();

    this.api
      .getAllEmailSettings({ pageIndex: 1, pageSize: 100, userId, userMail, clientIP: '' })
      .subscribe({
        next: (res: any) => {
          this.emailSettingsList = res.settings || [];
        },
        error: (err) => {
          console.error('Failed to load email settings', err);
        },
      });
  }

  onCancel() {
    this.router.navigate(['/masters/email-templates']);
  }

  onSave() {
    if (this.templateForm.invalid || this.isEditorEmpty()) {
      this.templateForm.markAllAsTouched();
      return;
    }

    const form = this.templateForm.value;
    const userMail = this.getUserMail();
    const userId = this.getUserId();

    this.getClientIP().subscribe({
      next: (ipRes: any) => {
        this.saveTemplate(form, userId, userMail, ipRes?.ip || '');
      },
      error: () => {
        this.saveTemplate(form, userId, userMail, '');
      },
    });
  }

  private saveTemplate(form: any, userId: number, userMail: string, clientIP: string) {
    this.isSaving = true;

    const payload: any = {
      userIndex: userId,
      userEmail: userMail,
      templateIndex: 0,
      templateInfo: form.templateInfo,
      templateString: form.templateString,
      emailIndex: form.emailIndex,
      webModule: '',
      applicabletags: form.applicabletags,
      emailHeader: form.emailHeader,
      recipientType: form.recipientType,
      emailModule: form.emailModule,
      userId: userId,
      userMail: userMail,
      clientIP: clientIP,
    };

    this.api.addUpdateEmailTemplate(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        if (res.successCode === 1) {
          this.successMessage = 'Template created successfully';
          setTimeout(() => {
            this.router.navigate(['/email-templates']);
          }, 1000);
        } else {
          this.errorMessage = 'Template creation failed';
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.errorMessage = 'Template creation failed';
      },
    });
  }
}
