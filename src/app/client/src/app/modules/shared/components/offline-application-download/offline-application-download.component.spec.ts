import { DeviceDetectorService } from 'ngx-device-detector';
import { CacheService } from 'ng2-cache-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ResourceService, ConfigService, BrowserCacheTtlService } from '@sunbird/shared';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflineApplicationDownloadComponent } from './offline-application-download.component';
import { TelemetryModule } from '@sunbird/telemetry';
import { Router, ActivatedRoute } from '@angular/router';

describe('OfflineApplicationDownloadComponent', () => {
  let component: OfflineApplicationDownloadComponent;
  let fixture: ComponentFixture<OfflineApplicationDownloadComponent>;
  class RouterStub {
    navigate = jasmine.createSpy('url');
  }

  const fakeActivatedRoute = {
    snapshot: {
      data: {
        telemetry: {
          env: 'explore', pageid: 'download-offline-app', type: 'view'
        }
      }
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TelemetryModule.forRoot()],
      declarations: [OfflineApplicationDownloadComponent],
      providers: [ResourceService, ConfigService, CacheService, BrowserCacheTtlService, DeviceDetectorService,
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: fakeActivatedRoute }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfflineApplicationDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
