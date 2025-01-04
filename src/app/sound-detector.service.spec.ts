import { TestBed } from '@angular/core/testing';

import { SoundDetectorService } from './sound-detector.service';

describe('SoundDetectorService', () => {
  let service: SoundDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundDetectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
