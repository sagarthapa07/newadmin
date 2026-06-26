  import {
    Component,
    ElementRef,
    ViewChild,
    HostListener,
    Output,
    EventEmitter,
    Input,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ImgResizeService } from '../../../core/Services/img-resize-service';

  type ResizeHandle = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br';

  @Component({
    standalone: true,
    selector: 'app-image-cropper',
    imports: [CommonModule],
    templateUrl: './image-cropper.html',
    styleUrl: './image-cropper.scss',
  })
  export class ImageCropper {
    @ViewChild('canvasWrap') canvasWrap!: ElementRef<HTMLDivElement>;
    @ViewChild('editorImg') editorImg!: ElementRef<HTMLImageElement>;

    // ★ Parent component ko resized images bhejne ke liye
    // Usage in parent: <app-photo-editor (onCropped)="cropImage($event)" [dirPath]="'img.Grants'" [recType]="'CU'" />
    @Output() onCropped = new EventEmitter<any[]>();
    @Input() imageSrc: string = '';
    @Input() dirPath: string = 'img.USGrants';
    @Input() recType: string = 'CU';

    // ★ Ye props parent se pass karo
    //dirPath = 'img.Grants'; // ya @Input() bana lo
  // dirPath = 'img.USGrants'; //NEw mere hisab se input file
  //  recType = 'CU'; // ya @Input() bana lo

    showEditor = false;
    fileName = '';
    outputSrc = '';
    isLoading = false; // Apply button pe loader
    resizeImages: any[] = []; // ImgResizeService ka result

    // image transform
    scale = 1;
    rotation = 0;
    flipH = 1;
    flipV = 1;
    tx = 0;
    ty = 0;

    // crop box
    crop = { x: 30, y: 30, w: 300, h: 300 };

    // interaction state
    private panning = false;
    private draggingCrop = false;
    private resizeHandle: ResizeHandle | null = null;
    private startMX = 0;
    private startMY = 0;
    private startTX = 0;
    private startTY = 0;
    private startCrop = { x: 0, y: 0, w: 0, h: 0 };

    constructor(private imgResizeService: ImgResizeService) {}
    ngOnChanges() {
      if (this.imageSrc) {
        this.outputSrc = this.imageSrc;
        this.fileName = 'AI Image';
      }
    }

    // ── File Input ────────────────────────────────────────────────
    fileChange(e: Event) {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      this.fileName = f.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.imageSrc = ev.target!.result as string;
        this.doReset();
        this.showEditor = true;
        setTimeout(() => this.initCropBox(), 100);
      };
      reader.readAsDataURL(f);
    }

    initCropBox() {
      const r = this.canvasWrap.nativeElement.getBoundingClientRect();
      const pad = 30;
      const s = Math.min(r.width - pad * 2, r.height - pad * 2);
      this.crop = { x: (r.width - s) / 2, y: (r.height - s) / 2, w: s, h: s };
    }

    // ── Zoom / Rotate / Flip / Reset ─────────────────────────────
    doZoom(d: number) {
      this.scale = Math.min(5, Math.max(0.1, +(this.scale + d).toFixed(2)));
    }
    doRotate(deg: number) {
      this.rotation = (this.rotation + deg + 360) % 360;
    }
    doFlip(axis: 'h' | 'v') {
      axis === 'h' ? (this.flipH *= -1) : (this.flipV *= -1);
    }
    doReset() {
      this.scale = 1;
      this.rotation = 0;
      this.flipH = 1;
      this.flipV = 1;
      this.tx = 0;
      this.ty = 0;
    }
    onWheel(e: WheelEvent) {
      e.preventDefault();
      this.doZoom(e.deltaY < 0 ? 0.1 : -0.1);
    }

    // ── Mouse Events ──────────────────────────────────────────────
    onCanvasMD(e: MouseEvent) {
      this.panning = true;
      this.startMX = e.clientX;
      this.startMY = e.clientY;
      this.startTX = this.tx;
      this.startTY = this.ty;
    }
    onCropMD(e: MouseEvent) {
      e.stopPropagation();
      this.draggingCrop = true;
      this.startMX = e.clientX;
      this.startMY = e.clientY;
      this.startCrop = { ...this.crop };
    }
    onHandleMD(e: MouseEvent, h: ResizeHandle) {
      e.stopPropagation();
      this.resizeHandle = h;
      this.startMX = e.clientX;
      this.startMY = e.clientY;
      this.startCrop = { ...this.crop };
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(e: MouseEvent) {
      const wrap = this.canvasWrap?.nativeElement;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const dx = e.clientX - this.startMX;
      const dy = e.clientY - this.startMY;
      if (this.resizeHandle) {
        this.doResize(dx, dy, r.width, r.height);
      } else if (this.draggingCrop) {
        this.crop.x = Math.max(0, Math.min(this.startCrop.x + dx, r.width - this.crop.w));
        this.crop.y = Math.max(0, Math.min(this.startCrop.y + dy, r.height - this.crop.h));
      } else if (this.panning) {
        this.tx = this.startTX + dx;
        this.ty = this.startTY + dy;
      }
    }

    doResize(dx: number, dy: number, maxW: number, maxH: number) {
      const min = 50;
      let { x, y, w, h } = this.startCrop;
      const hnd = this.resizeHandle!;
      if (hnd.includes('l')) {
        x = Math.min(x + dx, x + w - min);
        w = this.startCrop.w - (x - this.startCrop.x);
      }
      if (hnd.includes('r')) {
        w = Math.max(min, w + dx);
      }
      if (hnd.includes('t')) {
        y = Math.min(y + dy, y + h - min);
        h = this.startCrop.h - (y - this.startCrop.y);
      }
      if (hnd.includes('b')) {
        h = Math.max(min, h + dy);
      }
      x = Math.max(0, x);
      y = Math.max(0, y);
      w = Math.min(w, maxW - x);
      h = Math.min(h, maxH - y);
      this.crop = { x, y, w, h };
    }

    @HostListener('document:mouseup')
    onMouseUp() {
      this.panning = false;
      this.draggingCrop = false;
      this.resizeHandle = null;
    }

    // ── CSS Transforms ────────────────────────────────────────────
    imgLayerStyle() {
      return `translate(calc(-50% + ${this.tx}px), calc(-50% + ${this.ty}px)) scale(${this.scale})`;
    }
    imgStyle() {
      return `rotate(${this.rotation}deg) scaleX(${this.flipH}) scaleY(${this.flipV})`;
    }

    // ── Close ─────────────────────────────────────────────────────
    closeEditor() {
      this.showEditor = false;
      this.doReset();
    }
    overlayClick(e: MouseEvent) {
      if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.closeEditor();
    }

    // ── Apply → Canvas crop → File → ImgResizeService ─────────────
    async applyEdit() {
      const img = this.editorImg.nativeElement;
      const wrap = this.canvasWrap.nativeElement;
      const wr = wrap.getBoundingClientRect();
      const ir = img.getBoundingClientRect();

      // ── Step 1: Canvas pe crop karo ───────────────────────────
      const scaleX = img.naturalWidth / ir.width;
      const scaleY = img.naturalHeight / ir.height;

      const ox = this.crop.x - (ir.left - wr.left);
      const oy = this.crop.y - (ir.top - wr.top);
      const srcX = Math.max(0, ox * scaleX);
      const srcY = Math.max(0, oy * scaleY);
      const srcW = Math.min(this.crop.w * scaleX, img.naturalWidth - srcX);
      const srcH = Math.min(this.crop.h * scaleY, img.naturalHeight - srcY);

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(300, 300);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.scale(this.flipH, this.flipV);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -300, -300, 600, 600);

      // ── Step 2: Canvas → preview show karo ───────────────────
      this.outputSrc = canvas.toDataURL('image/png');

      // ── Step 3: Canvas → File (Blob) banao ───────────────────
      const croppedFile = await new Promise<File>((resolve) => {
        canvas.toBlob(
          (blob) => {
            const file = new File([blob!], this.fileName || 'cropped.jpg', { type: 'image/jpeg' });
            resolve(file);
          },
          'image/jpeg',
          0.92,
        );
      });

      // ── Step 4: ImgResizeService call karo ───────────────────
      try {
        this.isLoading = true;
        this.resizeImages = await this.imgResizeService.imgResize(
          croppedFile,
          this.dirPath, // e.g. 'img.Grants'
          this.recType, // e.g. 'CU' ya 'TC' ya default
        );

        console.log('✅ Resize complete:', this.resizeImages);

        // ── Step 5: Parent ko emit karo ──────────────────────
        this.onCropped.emit(this.resizeImages);

        this.showEditor = false;
      } catch (err) {
        console.error('❌ Resize failed:', err);
      } finally {
        this.isLoading = false;
      }
    }

    @HostListener('document:keydown', ['$event'])
    onKey(e: KeyboardEvent) {
      if (!this.showEditor) return;
      if (e.key === 'Escape') this.closeEditor();
      if (e.key === '+' || e.key === '=') this.doZoom(0.1);
      if (e.key === '-') this.doZoom(-0.1);
    }
    
  }
