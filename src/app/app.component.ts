import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  Renderer2,
  HostListener
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { takeUntil, tap, map, first } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { UserType } from './core/auth/enums/user-types.enum';
import { CurrentUser } from './core/auth/models/current-user.model';
import { selectCurrentUser } from './core/auth/selectors/auth.selector';
import { EventsState } from './core/reducers';
import { SocketService } from './core/services/socket.service';
import { selectEventData } from './core/virtual-events/selectors/app.selectors';
import { Unsubscriber } from './shared/classes/unsubscriber.class';
import { SnackBarMessageComponent } from './shared/components/snack-bar-message/snack-bar-message.component';
import { MessageService } from './shared/services/message.service';
import { DynamicMetaTagService } from './core/services/dynamic-meta-tag.service';
import { Router, NavigationEnd } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { selectOtherProfileState, selectProfileState, ToggleUserProfile, RoundtableModel, LoaderService, adobeAnalytics, EventDataModel } from './core/virtual-events';
import { Title, Meta } from '@angular/platform-browser';
import { AppConstants } from './core/constants/app.constants';
import { ToggleMyAgenda, ToggleNotification, ToggleRoundtableEditView } from './core/virtual-events/actions/common.actions';
import * as _ from 'lodash';

import {
  selectToggleMyAgenda,
  selectToggleNotification,
  selectToggleRoundtableEditView,
  selectToggleRoundtableView,
  selectToggleRoundtableAgoraVideo,
  selectToggleRoundtableZoomVideo,
  selectToggleSchedule,
  selectToggleScheduleBooth,
  selectToggleSchedulePersonal,
  selectPosterDetailState,

  selectToggleRealcommSponsors
} from './core/virtual-events/selectors/common.selectors';

import { LocalStorageService } from './core/services/local-storage.service';
import { Logger } from './core/classes/logger.service';
import { FirebaseService } from './core/services/firebase.service';
declare function AnalyticScript(any): any;
declare function AnalyticScriptNew(any): any;
declare function initializeBot(): any;
declare function initTableauTagManger(): any;
declare function initTableauApacTagManger(): any;
declare function initInformaFbPicketManger(): any;
declare function initializeAnitaB(): any;
declare function initBOMATagManger(): any;
declare var $: any;
declare var awa: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent extends Unsubscriber implements OnInit, OnDestroy {
  isSidebarActive = false;
  isProfileVisible = false;
  toggleOtherprofile = false;
  togglePosterDetail = false;
  isNotificationsVisible = false;
  durationInSeconds = 10;
  snackBarRef: any;
  currentURL: string;
  conferenceId: number;
  eventData: EventDataModel;
  showMyAgenda = false;
  selectedUserId: number;
  posterId: string;
  posterSerial: number;
  currentUser: CurrentUser;
  userIsModerator: boolean;
  isRoundtableCreate: boolean;
  isRoundtableView: boolean;
  isRoundtableAgoraDialog: boolean;
  isRoundTableZoomDialog: boolean;
  isScheduleView: boolean;
  isScheduleBoothView: boolean;
  isSchedulePersonalView: boolean;
  isToggleRealcommSponsors: boolean = false;
  cookieAccepted: boolean = true;

  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    sessionStorage.removeItem('sponsorPreviewObject');
  }

  constructor(
    private renderer2: Renderer2,
    private store: Store<EventsState>,
    private loaderService: LoaderService,
    @Inject(DOCUMENT) private document: Document,
    private snackBar: MatSnackBar,
    private messageService: MessageService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private localStorage: LocalStorageService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private meta: DynamicMetaTagService,
    private titleService: Title,
    private firebaseService: FirebaseService,
    private metaService: Meta
  ) {
    super();

    this.hideSpinner();
    this.spinner.show('appLoading');
  }

  ngOnInit(): void {

    const log = new Logger('myFile');
  

    this.store.select(selectCurrentUser)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => {
        if (user) {
          this.selectedUserId = user.userId;
          this.currentUser = user;
          if (this.currentUser.userTypeId === UserType.Moderator || this.currentUser.userTypeId === UserType.Creator) {
            this.userIsModerator = true;
          }

          this.cdr.markForCheck();
        }
      });

    this.store.select(selectToggleMyAgenda)
      .subscribe(s => {
        this.showMyAgenda = s;
        this.cdr.markForCheck();
      });

    this.store.select(selectToggleNotification)
      .subscribe(s => {
        this.isNotificationsVisible = s;
        this.cdr.markForCheck();
      });


    this.store.select(selectToggleRoundtableEditView)
      .subscribe(s => {
        this.isRoundtableCreate = s.toggle;
        this.cdr.markForCheck();
        if (s.toggle) {
          this.renderer2.addClass(document.body, 'modal-open');
        } else if (!s.toggle) {
          this.renderer2.removeClass(document.body, 'modal-open');
        }
      });

    this.store.select(selectToggleRoundtableView)
      .subscribe(s => {
        this.isRoundtableView = s.toggle;
        this.cdr.markForCheck();
      });

    this.store.select(selectToggleRoundtableAgoraVideo)
      .subscribe(s => {
        this.isRoundtableAgoraDialog = s.toggle;
        this.cdr.markForCheck();
      });

    this.store.select(selectToggleRoundtableZoomVideo)
      .subscribe(s => {
        this.isRoundTableZoomDialog = s.toggle;
        this.cdr.markForCheck();
      });

    this.store.select(selectToggleSchedule)
      .subscribe(s => {
        this.isScheduleView = s.toggle;
        this.cdr.markForCheck();
      });

    this.store.select(selectToggleScheduleBooth)
      .subscribe(s => {
        this.isScheduleBoothView = s.toggle;
        this.cdr.markForCheck();
      });

    this.store.select(selectToggleSchedulePersonal)
      .subscribe(s => {
        this.isSchedulePersonalView = s.toggle;
        this.cdr.markForCheck();
      });

    this.store.select(selectToggleRealcommSponsors)
      .subscribe(s => {
        this.isToggleRealcommSponsors = s;
        this.cdr.markForCheck();
      });

    const formOpen = this.localStorage.get(AppConstants.roundTableFormOpen);
    if (formOpen) {
      this.localStorage.remove(AppConstants.roundTableFormOpen);
      this.store.dispatch(new ToggleRoundtableEditView({ toggle: true, table: new RoundtableModel() }));
    }

    this.reconnectSocket();

  }

  ChangeFavIcon(logo: string, favIcon: string, useLogoAsFavIcon: boolean) {
    if (useLogoAsFavIcon) {
      let linkElement = document.getElementById('myFavIcon');
      linkElement.setAttribute('href', logo);
    }
    else if (favIcon != '') {
      let linkElement = document.getElementById('myFavIcon');
      linkElement.setAttribute('href', favIcon);
    }
    else {
      let linkElement = document.getElementById('myFavIcon');
    }
  }

  subJourneyState() {
    this.store.dispatch(new ToggleMyAgenda({ toggle: false }));
  }

  reconnectSocket() {
    this.messageService.getSocketReconnectedStatus().pipe(takeUntil(this.unsubscribe)).subscribe((status: boolean) => {
      console.log('reconnecting ', status, 'user id ', this.selectedUserId);
      if (status) {
        //if (this.selectedUserId) {
        this.socketService.registerUserSpecificSocket(this.conferenceId, this.selectedUserId, true);
        //}
        if (this.userIsModerator) {
          const groupKey = AppConstants.moderatorKey + this.conferenceId;
          this.socketService.registerRoleSpecificSocket(groupKey, this.selectedUserId);
        }
        this.cdr.markForCheck();
      }
    });
  }

  subMessageService() {
    this.messageService
      .getMessage()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => {
        if (res) {
          this.snackBar.openFromComponent(SnackBarMessageComponent, {
            duration: this.durationInSeconds * 1000,
            horizontalPosition: 'end',
            panelClass: ['de-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
  }

  loadCSSTheme(link: string) {
    this.document.getElementById('theme').setAttribute('href', link);
  }

  loadCustomTheme(customStyle: string) {
    try {
      const style = document.getElementById('customStyle');
      style.appendChild(document.createTextNode(customStyle));
      style.appendChild(style);
    } catch {
    }
  }

  toggleBodyClass(value: boolean) {
    this.isSidebarActive = value;
  }


  toggleProfileDrawer(value: boolean) {
    this.store.dispatch(new ToggleUserProfile({ toggle: false }));
  }

  toggleNotificationsDrawer(value: boolean) {
    this.store.dispatch(new ToggleNotification({ toggle: value }));
  }

  private hideSpinner(): void {
    this.router.events.pipe(
      map(e => Boolean(e instanceof NavigationEnd)),
      first<boolean>(Boolean),
    ).subscribe(() => this.spinner.hide('appLoading'));
  }

  initializeGoogleAnalytics(gCode: string) {
    if (!(environment.production || gCode)) return;

    if (gCode.indexOf('G-') > -1 && gCode) {
      let script = this.renderer2.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gCode}`;
      script.type = `text/javascript`;
      var head1 = document.getElementsByTagName("head")[0];
      head1.insertBefore(script, head1.firstChild);
      AnalyticScriptNew(gCode);
    } else {
      AnalyticScript(gCode);
    }
  }

  async initilizeAdobeAnalyticsScript(eventId: number) {
    if (
      (
        AppConstants.microsoftBusinessLaunchEvent === eventId
        || AppConstants.microsoftOpenAzureDay === eventId
      )
      && environment.production
    ) {
      await this.loaderService.loadScriptAsync(adobeAnalytics);
      var config = {
        autoCapture: {
          lineage: true
        },
        coreData: {
          appId: "js"
        }
      };
      if (typeof awa === 'object') {
        awa?.init(config);
        this.router.events.subscribe(event => {
          if (event instanceof NavigationEnd) {
            awa?.init(config);
            console.log('awa called', awa.isInitialized);
            this.cdr.markForCheck();
          }
        })
      }
      else
        console.log('awa is not a function');
    }
  }

  initilizeBotScript() {
    if (AppConstants.tableau === this.currentUser.eventId || AppConstants.tableau1 === this.currentUser.eventId) {
      initializeBot();
    }
  }

  initilizeAnalyticsScripts() {
    if (AppConstants.tableau === this.currentUser.eventId || AppConstants.tableau1 === this.currentUser.eventId) {
      initializeBot();
    }
  }

  appendEventScripts() {

    if (this.conferenceId && AppConstants.tableau === this.conferenceId || AppConstants.tableau1 === this.conferenceId) {
      if (environment.production) {
        initTableauTagManger();
        $('#tableauNoScript').append('<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-BVCN" height = "0" width = "0" style = "display:none;visibility:hidden" > </iframe>');
      }
    }

    if (this.conferenceId && AppConstants.tableauApac === this.conferenceId) {
      if (environment.production) {
        initTableauApacTagManger();
        $('#tableauNoScript').append('<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-BVCN" height = "0" width = "0" style = "display:none;visibility:hidden" > </iframe>');
      }
    }

    // informa
    if (this.conferenceId && AppConstants.informa === this.conferenceId) {
      if (environment.production) {
        initInformaFbPicketManger();
        $('#tableauNoScript').append('<img height="1" width="1" style="display:none" src = "https://www.facebook.com/tr?id=2113310978924311&ev=PageView&noscript=1"/>');
      }
    }

    // anitabghc
    if (this.conferenceId && AppConstants.anitabgc === this.conferenceId) {
      if (environment.production) {
        initializeAnitaB();
      }
    }

    // BOMA tag manager
    if (this.conferenceId && AppConstants.boma === this.conferenceId) {
      if (environment.production) {
        initBOMATagManger();
        $('#tableauNoScript').append('<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PGX824T" height = "0" width = "0" style = "display:none;visibility:hidden" > </iframe>');
      }
    }
  }

  appendCookieConsent() {
    if (this.conferenceId === AppConstants.ulifm || !environment.production)
      return;

    let script = this.renderer2.createElement('script');
    script.src = `https://cdn.cookielaw.org/scripttemplates/otSDKStub.js`;
    script.type = `text/javascript`;
    script.charset = `UTF-8`;
    script.setAttribute(`data-domain-script`, `98fb93a6-edb6-437d-bc8c-1278b221a547`);
    var head1 = document.getElementsByTagName("head")[0];
    head1.insertBefore(script, head1.firstChild);
  }

  get isMicrosoftEvent() {
    if (!environment.production)
      return false;
    return [
      AppConstants.msevent,
      AppConstants.microsoftBusinessLaunchEvent,
      AppConstants.microsoftCanada,
      AppConstants.microsoftExiteDay,
      AppConstants.microsoftInternday,
      AppConstants.microsoftReturnToworkplace,
      AppConstants.microsoftAgmSummit,
      AppConstants.microsoftDynamics,
      AppConstants.MicrosoftFutureNow,
      AppConstants.MicrosoftEnvisionUk,
      AppConstants.microsoftOpenAzureDay
    ].indexOf(this.conferenceId) > -1;
  }

  get isMsEvent() {
    return this.conferenceId === AppConstants.msevent;
  }

  initMetaTags() {
    if (this.conferenceId === AppConstants.microsoftOpenAzureDay) {

      // MOAD - Microsoft Open Azure Day event meta data
      const moadEvent = {
        description: `Learn to natively run Linux and open source in the cloud—and push your apps and data to the next level.
                    Join this free digital event to hear about the latest trends and best practices for running Linux on Azure
                    from Microsoft insiders and partners, including Red Hat, SUSE, HashiCorp, Elastic Cloudera,
                    VMware, and Redis Labs`,
        keywords: `linux on azure, linux on cloud, open source cloud, oss cloud, open azure day`,
      };
      this.meta.updateTitle(this.eventData?.title);
      this.meta.updateMetaInfo(moadEvent.description, moadEvent.keywords);
      this.meta.addMetaTags(this.eventData?.title, this.eventData.abstract || moadEvent.description, this.eventData?.logo);
    }
  }


  //initializeGoogleTranslate() {
  //  if(!google?.translate)
  //  if (environment.production && this.conferenceId === AppConstants.veevakorean) {
  //    let script = this.renderer2.createElement('script');
  //    script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
  //    script.type = `text/javascript`;
  //    var head1 = document.getElementsByTagName("head")[0];
  //    head1.insertBefore(script, head1.firstChild);
  //   }
  //}

  closebtn() {
    this.cookieAccepted = false;
  }

  private detectVisibiltyChanges() {
    document.addEventListener("visibilitychange", () => {
      this.store.select(selectCurrentUser)
        .subscribe((currentUser) => {
          if (currentUser) {

            let isActive = !document.hidden;
            this.firebaseService.setStatus(currentUser.eventId, currentUser.userId, isActive);

          }
        });
    }
    );
  }
}
