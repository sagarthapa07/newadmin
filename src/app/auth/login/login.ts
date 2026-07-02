import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../core/Services/auth';
import { Common } from '../../core/Services/common';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertMessage],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  loading = false;
  successMessage = '';
  errorMessage = '';

  loginForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private auth: Auth,
    private router: Router,
    private common: Common,
  ) {}

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;

    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      userName: this.loginForm.value.name,
      userPassword: 'Ps/YXj//LALs1VU3swk8ZA==',
    };

    this.auth.login(payload).subscribe({
      next: (res) => {
        console.log(res);

        this.loading = false;

        if (res.successCode === 1) {
          console.log('Login Success');

          this.auth.setSession(res.result);

          console.log('Session Created');

          this.router.navigate(['/']).then((res) => {
            console.log('Navigate Result:', res);
          });
        } else {
          this.errorMessage = res.message;
        }
      },

      error: () => {
        this.loading = false;

        this.errorMessage = 'Server Error';
      },
    });
  }
}
