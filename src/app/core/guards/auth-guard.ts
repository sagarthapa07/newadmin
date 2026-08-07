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
    const login = this.auth.isLoggedIn();
    if (login) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
