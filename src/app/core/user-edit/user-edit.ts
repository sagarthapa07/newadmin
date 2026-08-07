import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/component/header/header';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import { Common } from '../Services/common';

@Component({
  selector: 'app-user-edit',
  imports: [CommonModule, ReactiveFormsModule, Header, AlertMessage],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEdit {
  userIndex: number | null = null;
  userForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  originalUserData: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
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
        password: [''],
        confirmPassword: [''],
        userStatus: ['ACTIVE', Validators.required],
        creationdate: [''],
        remark: [''],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit() {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.userIndex = Number(idFromRoute);
      this.loadUser(this.userIndex);
    }
  }

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

  loadUser(id: number) {
    this.isLoading = true;
    const userMail = this.getUserMail();
    const userId = this.getUserId();

    const payload = {
      pageIndex: 1,
      pageSize: 1000,
      searchText: null,
      userId,
      userMail,
      clientIP: '',
    };

    this.api.getUserRecords(payload).subscribe({
      next: (res: any) => {
        const list = res.result || [];
        const found = list.find((x: any) => x.userIndex === id);
        if (found) {
          this.originalUserData = found;
          this.fillForm(found);
        } else {
          this.errorMessage = 'User not found';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load user';
        this.isLoading = false;
      },
    });
  }

  fillForm(data: any) {
    this.userForm.patchValue({
      userName: data.userName,
      fullName: data.fullName,
      emailId: data.emailId,
      userType: data.userType,
      userStatus: data.userStatus,
      creationdate: data.creationdate ? data.creationdate.split('T')[0] : '',
      remark: data.remark,
    });
  }

  onCancel() {
    this.router.navigate(['/masters/users']);
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
    const payload: any = {
      email: '',
      id: this.originalUserData?.id ?? null,
      userIndex: this.userIndex || 0,
      userName: form.userName,
      fullName: form.fullName,
      emailId: form.emailId,
      userType: form.userType,
      userTypeIndex: this.originalUserData?.userTypeIndex ?? 0,
      userStatus: form.userStatus,
      creationdate: form.creationdate
        ? new Date(form.creationdate).toISOString()
        : this.originalUserData?.creationdate,
      remark: form.remark,
      userId: userId,
      userMail: userMail,
      clientIP: clientIP,
    };

    if (form.password) {
      const encryptedPassword = this.common.encryptData(form.password);
      if (encryptedPassword) {
        payload.userPassword = encryptedPassword;
      } else {
        this.errorMessage = 'Password encryption failed. Please try again.';
        return;
      }
    }

    this.api.addUpdateUserRecord(payload).subscribe({
      next: (res: any) => {
        if (res.successCode === 1) {
          this.successMessage = 'User updated successfully';
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
