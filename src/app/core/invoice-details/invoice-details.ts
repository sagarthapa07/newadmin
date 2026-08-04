import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [CommonModule, DatePipe, Header],
  templateUrl: './invoice-details.html',
  styleUrl: './invoice-details.scss',
})
export class InvoiceDetails implements OnInit {
  @ViewChild('invoiceCard') invoiceCardRef!: ElementRef<HTMLDivElement>;

  invoiceId!: number;
  invoice: any = {};
  isLoading = false;
  isGeneratingPdf = false;

  constructor(
    private route: ActivatedRoute,
    private api: Api,
    private location: Location,
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
        this.invoice = res.invoice || res.result || res;
        this.isLoading = false;
      },

      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }


  goBack(): void {
    this.location.back();
  }

  printInvoice() {
    window.print();
  }

  async downloadPdf(): Promise<void> {
    if (!this.invoiceCardRef?.nativeElement || this.isGeneratingPdf) return;

    this.isGeneratingPdf = true;
    try {
      const element = this.invoiceCardRef.nativeElement;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
      pdf.save(`Invoice-${this.invoice?.invoiceNumber || this.invoiceId}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  sendEmail(): void {
    const to = this.invoice?.payerEmail || '';
    const subject = encodeURIComponent(
      `Invoice ${this.invoice?.invoiceNumber || ''} — FundsforNGOs`,
    );
    const body = encodeURIComponent(
      `Hi ${this.invoice?.firstName || ''},\n\n` +
        `Here are your invoice details:\n\n` +
        `Invoice #: ${this.invoice?.invoiceNumber || ''}\n` +
        `Invoice Date: ${this.invoice?.invoiceDate || ''}\n` +
        `Amount: ${Number(this.invoice?.planAmount || 0).toFixed(2)} USD\n\n` +
        `Thank you for your business.\n\nFUNDSFORNGOS, LLC`,
    );

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }
}