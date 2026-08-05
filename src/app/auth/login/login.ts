import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/Services/auth';
import { Common } from '../../core/Services/common';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { CommonModule } from '@angular/common';

const REMEMBERED_USER_KEY = 'gfu_remembered_username';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertMessage],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  loading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  currentYear = new Date().getFullYear();

  loginForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(true),
  });

  constructor(
    private auth: Auth,
    private router: Router,
    private common: Common,
  ) {}

  ngOnInit(): void {
    const rememberedUser = localStorage.getItem(REMEMBERED_USER_KEY);
    if (rememberedUser) {
      this.loginForm.patchValue({ name: rememberedUser, rememberMe: true });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    const { name, password, rememberMe } = this.loginForm.value;
    const payload = {
      userName: name,
      userPassword: this.common.encryptData(password!),
    };

    this.auth.login(payload).subscribe({
      next: (res) => {
        console.log('================ LOGIN RESPONSE ================');
        console.log(res);
        this.loading = false;
        if (res.successCode === 1) {
          console.log('API Login Success');
          const sessionCreated = this.auth.setSession(res.result);
          console.log('Session Created :', sessionCreated);
          console.log('User :', res.result);

          if (rememberMe) {
            localStorage.setItem(REMEMBERED_USER_KEY, name || '');
          } else {
            localStorage.removeItem(REMEMBERED_USER_KEY);
          }
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res.message;
        }
      },

      error: (err) => {
        console.log('C. API error:', err);
        this.loading = false;
        this.errorMessage = 'Server Error';
      },
    });
  }
}
