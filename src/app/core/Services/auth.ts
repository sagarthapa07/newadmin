import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Common } from './common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class Auth {

  constructor(
    private http: HttpClient,
    private common: Common,
    private router: Router,
  ) {}

  // API call
  login(data: any) {
    return this.http.post<any>(environment.apiUrl, data);
  }

  isLoggedIn(): boolean {
    const user = this.common.getCookie('_US_ADMIN_AUTH_');
    return !!user;
  }

  getUser() {
    const encrypted = this.common.getCookie('_US_ADMIN_AUTH_');
    if (!encrypted) return null;
    const decrypted = this.common.decryptData(encrypted);
    return JSON.parse(decrypted!);
  }


  // set cookie
  setSession(user: any) {
    const expire = new Date();
    expire.setDate(expire.getDate() + 7);
    const encryptedUser = this.common.encryptData(JSON.stringify(user));

    this.common.setCookie('_US_ADMIN_AUTH_', encryptedUser!, expire);
    console.log(this.common.getCookie('UserData')); 
  }
  // logout
  logout() {
    this.common.deleteCookie('_US_ADMIN_AUTH_');
    this.router.navigate(['/login']);
  }
}
