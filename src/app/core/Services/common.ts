import { Inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import * as moment from 'moment';
import 'moment-timezone';

@Injectable({
  providedIn: 'root',
})
export class Common {
  constructor(@Inject(CookieService) private Cookie: CookieService) {}

  // public setCookie(key: string, value: string, expireTime: any): boolean {
  //   this.Cookie.set(key, value, {
  //     expires: expireTime,
  //     path: '/',
  //     sameSite: 'Lax',
  //     domain: environment.domain,
  //     secure: window.location.protocol === 'https:',
  //   });

  //   return true;
  // }

  // public getCookie(key: string) {
  //   return this.Cookie.get(key);
  // }

  public setCookie(key: string, value: string, expireTime: any): boolean {
    const isLocalhost = window.location.hostname === 'localhost';
    const cookieDomain = isLocalhost ? undefined : environment.domain;

    this.Cookie.set(key, value, {
      expires: expireTime,
      path: '/',
      sameSite: 'Lax',
      domain: cookieDomain,
      secure: window.location.protocol === 'https:',
    });
    return true;
  }

  public getCookie(key: string) {
    const cookie = this.Cookie.get(key);
    return cookie;
  }

  public deleteCookie(key: string) {
    const isLocalhost = window.location.hostname === 'localhost';
    const cookieDomain = isLocalhost ? undefined : environment.domain;
    const isSecure = window.location.protocol === 'https:';
    this.Cookie.delete(key, '/', cookieDomain, isSecure);
  }

  public deleteAllCookie() {
    var cookies = document.cookie.split('; ');
    for (var c = 0; c < cookies.length; c++) {
      var d = window.location.hostname.split('.');
      while (d.length > 0) {
        var cookieBase =
          encodeURIComponent(cookies[c].split(';')[0].split('=')[0]) +
          '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' +
          d.join('.') +
          ' ;path=';
        var p = location.pathname.split('/');
        document.cookie = cookieBase + '/';
        while (p.length > 0) {
          document.cookie = cookieBase + p.join('/');
          p.pop();
        }
        d.shift();
      }
    }
  }

  decrypt(key: string, value: string): string {
    const bytes = CryptoJS.AES.decrypt(value, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  encryptData(data: string) {
    console.log('Data Before Encrypt :', data);
    try {
      const key = CryptoJS.enc.Utf8.parse(environment.cookieKey);
      const iv = CryptoJS.enc.Utf8.parse('');
      const encrypted: any = CryptoJS.AES.encrypt(data, key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return encrypted.toString();
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  encryptData1(data: string) {
    try {
      const key = CryptoJS.enc.Utf8.parse(environment.cookieKey);
      const iv = CryptoJS.enc.Utf8.parse('');
      const encrypted: any = CryptoJS.AES.encrypt(data, key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return encrypted.toString().replace(/=/g, '|').replace(/\//g, '!').replace(/\+/g, '-');
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  decryptData(encryptedText: string) {
    encryptedText = encryptedText.replace(/\|/g, '=').replace(/!/g, '/').replace(/\-/g, '+');
    try {
      const key = CryptoJS.enc.Utf8.parse(environment.cookieKey);
      const iv = CryptoJS.enc.Utf8.parse('');
      const decrypted = CryptoJS.AES.decrypt(encryptedText.trim(), key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  getCurrentDate() {
    return moment.tz('America/New_York').format('YYYY');
  }

  getCurrentYear() {
    return moment.tz('America/New_York').format('YYYY');
  }
}
