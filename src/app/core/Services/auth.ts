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
  login(data: any) {
    return this.http.post<any>(environment.apiUrl, data);
  }
  isLoggedIn(): boolean {
    const user = this.common.getCookie('_US_ADMIN_AUTH_');
    console.log('Cookie in Auth :', user);
    return !!user;
  }
  // getUser() {
  //   const encrypted = this.common.getCookie('_US_ADMIN_AUTH_');
  //   if (!encrypted) return null;
  //   const decrypted = this.common.decryptData(encrypted);
  //   if (!decrypted) return null;
  //   return JSON.parse(decrypted);
  // }

  // Agar encryption hta de toh ye rhegaa mera GEt user
  getUser() {
    const user = this.common.getCookie('_US_ADMIN_AUTH_');
    if (!user) return null;
    return JSON.parse(user);
  }

  // bina Encryption k hai yee
  setSession(user: any) {
    console.log('============== setSession ==============');
    const expire = new Date();
    expire.setDate(expire.getDate() + 7);
    const plainUser = JSON.stringify(user);
    console.log('Plain User :', plainUser);
    this.common.setCookie('_US_ADMIN_AUTH_', plainUser, expire);
    console.log('Cookie Saved');
    return true;
  }

  // setSession(user: any) {
  //   console.log('============== setSession ==============');
  //   console.log('User Data :', user);
  //   const expire = new Date();
  //   expire.setDate(expire.getDate() + 7);
  //   console.log('Expire :', expire);
  //   const encryptedUser = this.common.encryptData(JSON.stringify(user));
  //   console.log('Encrypted User :', encryptedUser);

  //   if (!encryptedUser) {
  //     console.log('Encryption Failed');
  //     return false;
  //   }

  //   console.log('Calling setCookie()');
  //   this.common.setCookie('_US_ADMIN_AUTH_', encryptedUser, expire);
  //   console.log('Cookie Function Executed');
  //   return true;
  // }

  logout() {
    this.common.deleteCookie('_US_ADMIN_AUTH_');
    this.router.navigate(['/login']);
  }
}
