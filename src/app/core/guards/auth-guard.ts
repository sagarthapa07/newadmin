import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../Services/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  canActivate(): boolean {
    console.log('AuthGuard Running');
    const login = this.auth.isLoggedIn();
    console.log('Is Logged In :', login);

    if (login) {
      console.log('Allow Route');
      return true;
    }

    console.log('Redirect Login');
    this.router.navigate(['/login']);
    return false;
  }
}
