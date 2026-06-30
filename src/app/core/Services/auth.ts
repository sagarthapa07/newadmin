import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Common } from './common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'https://ang-dnd.fundsforngospremium.com/api/UserManagement/AutheticateUser';

  constructor(
    private http: HttpClient,
    private common: Common,
    private router: Router,
  ) {}

  // API call
  login(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }

  // cookie check
  isLoggedIn(): boolean {
    const token = this.common.getCookie('_ADMIN_ACCESSTOKEN_');

    if (token) {
      return true;
    }

    return false;
  }
  getUser() {
    return this.common.getCookie('userAuth');
  }

  // set cookie

  // setSession(userData: any) {
  //   const expireDate = new Date();
  //   expireDate.setDate(expireDate.getDate() + 7);

  //   this.common.setCookie('userAuth', userData, expireDate);
  // }

  setSession(user: any) {
    const expire = new Date();
    expire.setDate(expire.getDate() + 7);

    // Dummy Tokens
    this.common.setCookie('_ADMIN_ACCESSTOKEN_', 'DummyAdminAccessToken', expire);

    this.common.setCookie('_USER_REFRESH_TOKEN_', 'DummyRefreshToken', expire);

    this.common.setCookie('_USR_ACCESSTOKEN_', 'DummyUserAccessToken', expire);

    // User Details
    this.common.setCookie('_ADMIN_AUTH_', JSON.stringify(user), expire);

    this.common.setCookie('_US_ADMIN_AUTH_', JSON.stringify(user), expire);

    this.common.setCookie('_USR_AUTH_', JSON.stringify(user), expire);

    // Location
    this.common.setCookie(
      'memberGeolocation',
      JSON.stringify({
        country: 'India',
        state: '',
        city: '',
      }),
      expire,
    );

    // Existing cookie (agar chahiye)
    this.common.setCookie('userAuth', JSON.stringify(user), expire);
  }
  // logout
  logout() {
    this.common.deleteCookie('_ADMIN_ACCESSTOKEN_');
    this.common.deleteCookie('_ADMIN_AUTH_');
    this.common.deleteCookie('_US_ADMIN_AUTH_');
    this.common.deleteCookie('_USER_REFRESH_TOKEN_');
    this.common.deleteCookie('_USR_ACCESSTOKEN_');
    this.common.deleteCookie('_USR_AUTH_');
    this.common.deleteCookie('memberGeolocation');
    this.common.deleteCookie('userAuth');

    this.router.navigate(['/login']);
  }
}
