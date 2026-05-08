import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../core/Services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  loginForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  // encryption (IMPORTANT)
  encryptPassword(password: string) {
    // const key = CryptoJS.enc.Utf8.parse('mySecretKey123');

    // const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(password), key, {
    //   mode: CryptoJS.mode.ECB,
    //   padding: CryptoJS.pad.Pkcs7,
    // });

    // return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const payload = {
      userName: this.loginForm.value.name,
      userPassword: this.encryptPassword(this.loginForm.value.password!),
    };

    this.auth.login(payload).subscribe({
      next: (res) => {
        if (res.successCode === 1) {
          this.auth.setSession();
          this.router.navigate(['/dashboard']);
        } else {
          alert('Username or Password wrong');
        }
      },
      error: () => {
        alert('Server error');
      },
    });
  }
}
