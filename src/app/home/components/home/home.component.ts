import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventsState } from '../../../core/reducers';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { CustomModulesModel } from '../../../core/virtual-events/models/custom-modules.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { EventService } from '../../../core/virtual-events/services/app.service';
import { BaseComponent } from '../../../core/components/base/base.component';
import { IComponent } from '../../../core/virtual-events';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { Guid } from 'guid-typescript';
import { SetAppStats } from 'src/app/core/virtual-events/actions/app.actions';
import { DOCUMENT } from '@angular/common';
import { PageIdsEnum } from 'src/app/core/virtual-events/enums/page-ids.model';
import { take, takeUntil, tap, filter } from 'rxjs/operators';
import { AppComponent } from '../../../app.component';
import { AppConstants } from '../../../core/constants/app.constants';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
  customModules: Array<CustomModulesModel> = [];
  nonCustomModules: Array<IComponent> = [];
  customHtmlById: { [id: string]: string } = {};
  previousUrl: any;
  currentUrl: string;
  groupId = Guid.create().toString();

  constructor(
    private spinner: NgxSpinnerService,
    private appService: EventService,
    route: ActivatedRoute,
    router: Router,
    store: Store<EventsState>,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit(): void {

    super.ngOnInit();

    this.pageBody$.pipe(filter(f => Boolean(f)), tap(res => {
      this.loadCustomModules();
    }), takeUntil(this.unsubscribe)).subscribe();

    this.setStats('IN');
  }
  trackByIndex(index: number): number {
    return index;
  }

  loadCustomModules(): void {
	this.spinner.show();
    const components = this.pageBody?.pages?.find(e => e.pageId === this.pageId)?.components;
    if (components) {
      this.nonCustomModules = components;
      this.nonCustomModules.forEach(c => {
        if (c.name == "ng-Custom") {
          if (c.htmlPath) {
            this.appService.getModuleHtml(c.htmlPath).subscribe((res) => {
              this.customHtmlById[c.Id] = res;
              this.cdr.markForCheck();
            });
          }
          else {
            this.loadHTMLCustomModules(c.Id.toString());
          }
        }
      });
    }
	this.spinner.hide();
  }

  loadHTMLCustomModules(id: string): void {
    this.appService.getCustomModules(this.eventData.conferenceId, this.pageId).subscribe((res) => {
      this.customModules = res.entity as unknown as Array<CustomModulesModel>;
      const currentComponent = this.customModules.find(x => x.moduleId === id);

      if (currentComponent) {
        this.appService.getModuleHtml(currentComponent.moduleHtml).subscribe((res) => {
          this.customHtmlById[currentComponent.moduleId] = res;
          this.cdr.markForCheck();
        });
      }
    });
  }

  getPlaylistId(playlistId: string) {
    if (!this.isLoggedIn && this.eventData.conferenceId === AppConstants.sema)
      return 'NEW_A910382334';
    else
      return playlistId;
  }
  
  ngOnDestroy() {
    super.ngOnDestroy();
    this.setStats('OUT');
  }

  setStats(vType: string) {

    let sessionId = this.getWithExpiry();
    if (!sessionId) {
      const now = new Date()
      sessionId = Guid.create().toString();

      // `item` is an object which contains the original value
      // as well as the time when it's supposed to expire
      const item = {
        value: sessionId,
        expiry: now.getTime() + 2.16e+7
      }
      localStorage.setItem("StatsSessionId", JSON.stringify(item));
    }

    if (vType === 'IN') {
      this.previousUrl = this.document.referrer.replace(window.location.origin, '');
      this.currentUrl = window.location.href.replace(window.location.origin, '');

      this.store.dispatch(new SetAppStats({
        eventId: this.eventData.conferenceId, stateObj: {
          UserId: this.userId,
          SectionId: 12,
          SectionBasedId: PageIdsEnum.Home,
          Previouspagelink: this.previousUrl,
          CurrentPageLink: this.currentUrl,
          PageUrl: this.currentUrl,
          UserSessions: sessionId,
          BrowserInfo: this.getBrowser(),
          OSInfo: this.getOS(),
          visitType: vType,
          visitTypeGroup: this.groupId
        }
      }));
    } else {
      const previousUrl = this.document.referrer.replace(window.location.origin, '');
      const currentUrl = window.location.href.replace(window.location.origin, '');

      this.store.dispatch(new SetAppStats({
        eventId: this.eventData.conferenceId, stateObj: {
          UserId: this.userId,
          SectionId: 12,
          SectionBasedId: PageIdsEnum.Home,
          Previouspagelink: this.currentUrl,
          Nextpagelink: currentUrl,
          CurrentPageLink: this.currentUrl,
          PageUrl: this.currentUrl,
          UserSessions: sessionId,
          BrowserInfo: this.getBrowser(),
          OSInfo: this.getOS(),
          visitType: vType,
          visitTypeGroup: this.groupId
        }
      }));

    }
  }
}
