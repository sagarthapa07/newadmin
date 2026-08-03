import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class Export {
  exportToExcel(data: any[], filePrefix: string, sheetName: string = 'Sheet1') {}

  exportToCsv(data: any[], filePrefix: string) {
    if (!data || data.length === 0) {
      alert('No data available');
      return;
    }

    const headers = Object.keys(data[0]);

    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }

      let stringValue = String(value);
      if (/[",\n\r]/.test(stringValue)) {
        stringValue = stringValue.replace(/"/g, '""');
        stringValue = `"${stringValue}"`;
      }

      return stringValue;
    };

    const csvRows: string[] = [];

    csvRows.push(headers.map((h) => escapeCsvValue(h)).join(','));

    data.forEach((row) => {
      const values = headers.map((header) => escapeCsvValue(row[header]));
      csvRows.push(values.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const fileName = `${filePrefix}_${day}-${month}-${year}_${hours}-${minutes}-${seconds}.csv`;

    saveAs(blob, fileName);
  }
}