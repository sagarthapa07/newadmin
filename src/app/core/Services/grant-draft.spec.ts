import { TestBed } from '@angular/core/testing';

import { GrantDraft } from './grant-draft';

describe('GrantDraft', () => {
  let service: GrantDraft;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GrantDraft);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
