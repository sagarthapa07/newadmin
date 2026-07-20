import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Theme {
  private key = 'theme';

  initTheme() {
    const saved = localStorage.getItem(this.key);

    if (saved === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }

  isDark() {
    return document.body.classList.contains('dark-theme');
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');

    localStorage.setItem(this.key, this.isDark() ? 'dark' : 'light');
  }
}
