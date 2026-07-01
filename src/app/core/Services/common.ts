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

  // public setCookie(key: string, value: string, expireTime: any) {
  //   this.Cookie.set(key, JSON.stringify(value), {
  //     expires: expireTime,
  //     // domain: environment.baseUrl,
  //     path: '/',
  //     sameSite: 'Lax',
  //   });

  //   return true;
  // }

  public setCookie(key: string, value: string, expireTime: any) {
    this.Cookie.set(key, value, {
      expires: expireTime,
      path: '/',
      sameSite: 'Lax',
    });

    return true;
  }

  // public getCookie(key: any) {
  //   let value: any = this.Cookie.get(key);
  //   if (value) {
  //     try {
  //       return JSON.parse(value);
  //     } catch (e) {
  //       return null;
  //     }
  //   }
  // }

  public getCookie(key: string) {
    return this.Cookie.get(key);
  }

  public deleteCookie(key: string) {
    document.cookie = encodeURIComponent(key) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/';
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

  //The set method is use for encrypt the value.
  encrypt(key: any, value: any) {
    return CryptoJS.AES.encrypt(JSON.stringify(value), key).toString();
  }

  //The get method is use for decrypt the value.
  decrypt(key: string, value: string): string {
    const bytes = CryptoJS.AES.decrypt(value, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  encryptData(data: string) {
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

      //  return  encrypted.toString().replace(/=/g, "|").replace(/\//g, "!").replace(/\+/g, "-")
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
