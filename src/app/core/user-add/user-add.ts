import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/component/header/header';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import { Common } from '../Services/common';

@Component({
  selector: 'app-user-add',
  imports: [CommonModule, ReactiveFormsModule, Header, AlertMessage],
  templateUrl: './user-add.html',
  styleUrl: './user-add.scss',
})
export class UserAdd {
  userForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api,
    private auth: Auth,
    private http: HttpClient,
    private common: Common,
  ) {
    this.userForm = this.fb.group(
      {
        userName: ['', Validators.required],
        fullName: ['', Validators.required],
        emailId: ['', [Validators.required, Validators.email]],
        userType: ['', Validators.required],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
        userStatus: ['ACTIVE', Validators.required],
        creationdate: [''],
        remark: [''],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // NOTE: Add screen mein koi existing id load nahi karni — form hamesha khali start hoga.
  // Isliye yahan ngOnInit mein UserEdit jaisa loadUser() call nahi hai.

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!password && !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
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
    const control = this.userForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onCancel() {
    this.router.navigate(['/user-list']);
  }

  onSave() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const form = this.userForm.value;
    const userMail = this.getUserMail();
    const userId = this.getUserId();

    this.getClientIP().subscribe({
      next: (ipRes: any) => {
        this.saveUser(form, userId, userMail, ipRes?.ip || '');
      },
      error: () => {
        this.saveUser(form, userId, userMail, '');
      },
    });
  }

  private saveUser(form: any, userId: number, userMail: string, clientIP: string) {
    this.isSaving = true;

    const encryptedPassword = this.common.encryptData(form.password);
    if (!encryptedPassword) {
      this.isSaving = false;
      this.errorMessage = 'Password encryption failed. Please try again.';
      return;
    }

    const payload: any = {
      email: '',
      id: null,
      userIndex: 0, // 0 / null => backend ko pata chalega ki naya user create karna hai
      userName: form.userName,
      fullName: form.fullName,
      emailId: form.emailId,
      userType: form.userType,
      userTypeIndex: 0,
      userStatus: form.userStatus,
      creationdate: form.creationdate
        ? new Date(form.creationdate).toISOString()
        : new Date().toISOString(),
      remark: form.remark,
      userPassword: encryptedPassword,
      userId: userId,
      userMail: userMail,
      clientIP: clientIP,
    };

    console.log('Payload sent to API (Add User):', payload);

    this.api.addUpdateUserRecord(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        if (res.successCode === 1) {
          this.successMessage = 'User created successfully';

          // NOTE: Apne actual API response ke shape ke hisaab se yahan newUserIndex nikalna hoga.
          // Neeche common possibilities cover ki hain — jo bhi tumhara backend return karta hai
          // usko match kar lo (res.result ek number ho sakta hai, ya object jisme userIndex ho).
          const newUserIndex =
            typeof res.result === 'number'
              ? res.result
              : (res.result?.userIndex ?? res.userIndex ?? res.result?.id ?? res.id);

          if (newUserIndex) {
            this.router.navigate(['/user-edit', newUserIndex]);
          } else {
            console.warn('New user ID API response mein nahi mila:', res);
          }
        } else {
          this.errorMessage = 'User creation failed';
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.errorMessage = 'User creation failed';
      },
    });
  }
}
