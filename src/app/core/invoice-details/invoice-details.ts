import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import { Footer } from '../../shared/component/footer/footer';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [CommonModule, DatePipe, Header],
  templateUrl: './invoice-details.html',
  styleUrl: './invoice-details.scss',
})
export class InvoiceDetails implements OnInit {
  invoiceId!: number;
  invoice: any = {};
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private api: Api,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.invoiceId = Number(id);
        this.getInvoiceDetails();
      }
    });
  }

  getInvoiceDetails() {
    this.isLoading = true;

    this.api.getInvoiceById(this.invoiceId).subscribe({
      next: (res: any) => {
        console.log('Invoice Details =>', res);
        this.invoice = res.invoice || res.result || res;
        this.isLoading = false;
      },

      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  printInvoice() {
    window.print();
  }
}
