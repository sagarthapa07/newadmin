import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Editor } from '../../shared/component/editor/editor';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import { Header } from '../../shared/component/header/header';

@Component({
  selector: 'app-email-templates',
  imports: [CommonModule, ReactiveFormsModule, Editor, AlertMessage, Header],
  templateUrl: './email-templates.html',
  styleUrl: './email-templates.scss',
})
export class EmailTemplates {
  @Input() templateId: number | null = null;
  @Output() cancelled = new EventEmitter<void>();

  templateForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  emailSettingsList: any[] = [];
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
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
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.templateId = Number(idFromRoute);
    }

    this.loadEmailSettings();

    if (this.templateId) {
      this.loadTemplate(this.templateId);
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
    const control = this.templateForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isEditorEmpty(): boolean {
    const value = this.templateForm.get('templateString')?.value || '';
    const plainText = value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim();
    return !plainText;
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

  loadTemplate(id: number) {
    this.api.getEmailTemplateById(id).subscribe({
      next: (res: any) => {
        if (res.successCode === 1 && res.template) {
          this.fillForm(res.template);
        } else {
          this.errorMessage = 'Template not found';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load template';
      },
    });
  }

  fillForm(data: any) {
    this.templateForm.patchValue({
      templateInfo: data.templateInfo,
      emailIndex: data.emailIndex,
      applicabletags: data.applicabletags,
      emailHeader: data.emailHeader,
      recipientType: data.recipientType,
      emailModule: data.emailModule,
      templateString: data.templateString,
    });
  }

  onCancel() {
    this.cancelled.emit();
    this.router.navigate(['/masters/email-templates']);
  }

  onSave() {
    if (this.templateForm.invalid || this.isEditorEmpty()) {
      this.templateForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

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
    const payload: any = {
      userIndex: userId,
      userEmail: userMail,
      templateIndex: this.templateId || 0,
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
        if (res.successCode === 1) {
          this.successMessage = 'Template updated successfully';
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
