import { throwError as observableThrowError, of as observableOf, Observable, of } from 'rxjs';
import { CourseHierarchyGetMockResponse } from '../../../../module/course/components/course-consumption/public-course-player/public-course-player.component.mock.data';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PublicPlayerService } from './../../../../services';
import { PublicContentPlayerComponent } from './public-content-player.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule, ResourceService, ToasterService, WindowScrollService } from '@sunbird/shared';
import { CoreModule, CoursesService } from '@sunbird/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { serverRes } from './public-content-player.component.spec.data';
import {CourseConsumptionService} from '@sunbird/learn';
import { TelemetryModule } from '@sunbird/telemetry';
import { ContentManagerService } from '@sunbird/offline';
class RouterStub {
  navigate = jasmine.createSpy('navigate');
  events = observableOf({ id: 1, url: '/play', urlAfterRedirects: '/play' });
}
class ActivatedRouteStub {
  snapshot = {
    params: {},
    firstChild: { params : {}}
  };
}
const fakeActivatedRoute = {
  'params': observableOf({ contentId: 'd0_33567325' }),
  'queryParams': observableOf({ language: ['en'] }, { dialCode: '61U24C' }, { l1Parent: 'd0_335673256' }),
  snapshot: {
    params: {
      contentId: 'd0_33567325'
    },
    queryParams: {
      l1Parent: 'd0_335673256'
    },
    data: {
      telemetry: {
        env: 'get', pageid: 'get', type: 'edit', subtype: 'paginate'
      }
    }
  }
};
const resourceServiceMockData = {
  messages: {
    imsg: { m0027: 'Something went wrong' },
    stmsg: { m0009: 'error' },
    fmsg: { m0090: 'Could not download. Try again later'}
  },
  frmelmnts: {
    btn: {
      tryagain: 'tryagain',
      close: 'close'
    },
    lbl: {
      description: 'description'
    }
  }
};
describe('PublicContentPlayerComponent', () => {
  let component: PublicContentPlayerComponent;
  let fixture: ComponentFixture<PublicContentPlayerComponent>;
  let activatedRouteStub, courseConsumptionService, courseService;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule.forRoot(), RouterTestingModule, HttpClientTestingModule,
      TelemetryModule.forRoot()],
      declarations: [PublicContentPlayerComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [PublicPlayerService, ContentManagerService,
        ToasterService, CourseConsumptionService,
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: Router, useClass: RouterStub }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicContentPlayerComponent);
    courseService = TestBed.get(CoursesService);
    activatedRouteStub = TestBed.get(ActivatedRoute);
    component = fixture.componentInstance;
    component.contentId = 'd0_33567325';
  });

  it('should config content player if content status is "Live"', () => {
    const windowScrollService = TestBed.get(WindowScrollService);
    spyOn(windowScrollService, 'smoothScroll');
    const playerService = TestBed.get(PublicPlayerService);
    const resourceService = TestBed.get(ResourceService);
    serverRes.result.result.content.status = 'Live';
    resourceService.messages = resourceServiceMockData.messages;
    resourceService.frmelmnts = resourceServiceMockData.frmelmnts;
    spyOn(playerService, 'getContent').and.returnValue(observableOf(serverRes.result));
    component.ngOnInit();
    expect(component.playerConfig).toBeTruthy();
  });
  it('should throw error if content api throws error', () => {
    const windowScrollService = TestBed.get(WindowScrollService);
    spyOn(windowScrollService, 'smoothScroll');
    const playerService = TestBed.get(PublicPlayerService);
    const resourceService = TestBed.get(ResourceService);
    resourceService.messages = resourceServiceMockData.messages;
    resourceService.frmelmnts = resourceServiceMockData.frmelmnts;
    spyOn(playerService, 'getContent').and.returnValue(observableThrowError(serverRes.failureResult));
    fixture.detectChanges();
    expect(component.playerConfig).toBeUndefined();
    expect(component.showError).toBeTruthy();
    expect(component.errorMessage).toBe(resourceService.messages.stmsg.m0009);
  });
  it('should call tryAgain method', () => {
    const windowScrollService = TestBed.get(WindowScrollService);
    spyOn(windowScrollService, 'smoothScroll');
    spyOn(component, 'tryAgain').and.callThrough();
    spyOn(component, 'getContent').and.callThrough();
    component.tryAgain();
    expect(component.showError).toBeFalsy();
    expect(component.getContent).toHaveBeenCalled();
  });
  it('should unsubscribe from all observable subscriptions', () => {
    component.getContent();
    spyOn(component.unsubscribe$, 'complete');
    component.ngOnDestroy();
    expect(component.unsubscribe$.complete).toHaveBeenCalled();
  });
  it('sets the badges data  after making api call and pass input to content-badges component', () => {
    const playerService = TestBed.get(PublicPlayerService);
    spyOn(playerService, 'getContent').and.returnValue(observableOf(serverRes.result));
    component.ngOnInit();
    expect(component.badgeData).toBeDefined();
    expect(component.showPlayer).toBeTruthy();
    expect(component.badgeData).toEqual(serverRes.result.result.content.badgeAssertions);
  });
  it('should open the pdfUrl in a new tab', () => {
    spyOn(window, 'open').and.callThrough();
    component.printPdf('www.samplepdf.com');
    expect(window.open).toHaveBeenCalledWith('www.samplepdf.com', '_blank');
  });
  it('should redirect to flattened dial code on click of close button', fakeAsync(() => {
    component.dialCode = '6466X';
    component.close();
    const router = TestBed.get(Router);
    tick(101);
    expect(router.navigate).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/get/dial/', '6466X'], {
      queryParams:
        { textbook: fakeActivatedRoute.snapshot.queryParams.l1Parent }
    });

  }));

  it('should detect the device and rotate to landscape', () => {
    component.isMobileOrTab = true;
    component.isSingleContent = true;
    spyOn(component, 'rotatePlayer');
    component.deviceDetector();
    expect(component.showFooter).toBe(true);
    expect(component.rotatePlayer).toHaveBeenCalled();
  });

  it('should detect the device and rotate to landscape if not a single content', () => {
    component.isMobileOrTab = true;
    component.isSingleContent = false;
    spyOn(component, 'rotatePlayer');
    component.deviceDetector();
    expect(component.loadLandscapePlayer).toBe(true);
    expect(component.showFooter).toBe(true);
    expect(component.rotatePlayer).toHaveBeenCalled();
  });

  it('should call deviceDetector', fakeAsync(() => {
    component.dialCode = 'ABC123';
    spyOn(component, 'deviceDetector');
    setTimeout(()  => {
      component.ngAfterViewInit();
    }, 100);
    tick(101);
    expect(component.telemetryCdata).toEqual([{ 'type': 'DialCode', 'id': 'ABC123'}]);
    expect(component.deviceDetector).toHaveBeenCalled();
  }));

  it('should load player on tap of play icon', () => {
    component.isMobileOrTab = true;
    spyOn(component, 'rotatePlayer');
    component.enablePlayer(true);
    expect(component.playerThumbnail).toBe(true);
    expect(component.rotatePlayer).toHaveBeenCalled();
  });

  it('should close player fullscreen ', () => {
    component.isSingleContent = true;
    component.closeFullscreen();
    expect(component.showCloseButton).toBe(false);
    expect(component.playerThumbnail).toBe(true);
  });

  it('should close player fullscreen and enable top div', () => {
    component.isSingleContent = false;
    component.closeFullscreen();
    expect(component.showCloseButton).toBe(false);
    expect(component.loadLandscapePlayer).toBe(false);
  });

  describe('should rotate player', () => {
    let mockDomElement;
    beforeEach(() => {
        mockDomElement = document.createElement('div');
        mockDomElement.setAttribute('id', 'playerFullscreen');
    });

    it('should rotate player for a default chrome browser', fakeAsync(() => {
      spyOn(document, 'querySelector').and.returnValue(mockDomElement);
      spyOn(screen.orientation, 'lock');
      component.rotatePlayer();
      tick(100);
      expect(component.showCloseButton).toBe(true);
      expect(screen.orientation.lock).toHaveBeenCalledWith('landscape');
    }));

    it('should rotate player for mozilla browser', fakeAsync(() => {
      mockDomElement.requestFullscreen = undefined;
      mockDomElement.mozRequestFullScreen = () => {};
      spyOn(document, 'querySelector').and.returnValue(mockDomElement);
      spyOn(screen.orientation, 'lock');
      component.rotatePlayer();
      tick(100);
      expect(component.showCloseButton).toBe(true);
      expect(screen.orientation.lock).toHaveBeenCalledWith('landscape');
    }));

    it('should rotate player for webkit browser', fakeAsync(() => {
      mockDomElement.requestFullscreen = undefined;
      mockDomElement.mozRequestFullScreen = undefined;
      mockDomElement.webkitRequestFullscreen = () => {};
      spyOn(document, 'querySelector').and.returnValue(mockDomElement);
      spyOn(screen.orientation, 'lock');
      component.rotatePlayer();
      tick(100);
      expect(component.showCloseButton).toBe(true);
      expect(screen.orientation.lock).toHaveBeenCalledWith('landscape');
    }));

    it('should rotate player ms browser', fakeAsync(() => {
      mockDomElement.requestFullscreen = undefined;
      mockDomElement.mozRequestFullScreen = undefined;
      mockDomElement.webkitRequestFullscreen = undefined;
      mockDomElement.msRequestFullscreen = () => {};
      spyOn(document, 'querySelector').and.returnValue(mockDomElement);
      spyOn(screen.orientation, 'lock');
      component.rotatePlayer();
      tick(100);
      expect(component.showCloseButton).toBe(true);
      expect(screen.orientation.lock).toHaveBeenCalledWith('landscape');
    }));
  });

  describe('should close the browser fullscreen mode', () => {
    it('should close player fullscreen for default chrome browser', () => {
      component.isSingleContent = true;
      component.closeFullscreen();
      expect(component.showCloseButton).toBe(false);
      expect(component.playerThumbnail).toBe(true);
    });

    it('should close player fullscreen for mozilla browser', () => {
      document['exitFullscreen'] = undefined;
      document['mozCancelFullScreen'] = () => {};
      component.isSingleContent = true;
      component.closeFullscreen();
      expect(component.showCloseButton).toBe(false);
      expect(component.playerThumbnail).toBe(true);
    });

    it('should close player fullscreen for webkit browser ', () => {
      document['exitFullscreen'] = undefined;
      document['mozCancelFullScreen'] = undefined;
      document['webkitExitFullscreen'] = () => {};
      component.isSingleContent = true;
      component.closeFullscreen();
      expect(component.showCloseButton).toBe(false);
      expect(component.playerThumbnail).toBe(true);
    });

    it('should close player fullscreen for ms browser ', () => {
      document['exitFullscreen'] = undefined;
      document['mozCancelFullScreen'] = undefined;
      document['webkitExitFullscreen'] = undefined;
      document['msExitFullscreen'] = () => {};
      component.isSingleContent = true;
      component.closeFullscreen();
      expect(component.showCloseButton).toBe(false);
      expect(component.playerThumbnail).toBe(true);
    });
  });

  it('should open share link popup and share url should be of anonymous explore course page', () => {
    activatedRouteStub.snapshot.firstChild.params = {courseId: 'do_212347136096788480178'};
    spyOn(courseConsumptionService, 'getCourseHierarchy').and.returnValue(of(CourseHierarchyGetMockResponse.result.content));
    spyOn(component, 'onShareLink').and.callThrough();
    courseService.initialize();
    component.ngOnInit();
    component.onShareLink();
    expect(component.sharelinkModal).toBe(true);
    expect(component.shareLink).toContain('explore-course/course/do_212347136096788480178');
  });
});
