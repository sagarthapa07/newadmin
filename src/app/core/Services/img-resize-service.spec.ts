import { TestBed } from '@angular/core/testing';

import { ImgResizeService } from './img-resize-service';

describe('ImgResizeService', () => {
  let service: ImgResizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImgResizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
