import { TestBed } from '@angular/core/testing';

import { Preview } from './preview';

describe('Preview', () => {
  let service: Preview;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Preview);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
