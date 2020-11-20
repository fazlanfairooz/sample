import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Guid } from 'guid-typescript';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, throwError } from 'rxjs';
import { catchError, filter, finalize, takeUntil, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/core/components/base/base.component';
import { environment } from 'src/environments/environment';

import { Register, UserLoaded } from '../../../core/auth/actions/auth.action';
import { UserType } from '../../../core/auth/enums/user-types.enum';
import { CurrentUser } from '../../../core/auth/models/current-user.model';
import { UserTokenModel } from '../../../core/auth/models/user-token.model';
import {
  selectCurrentUser,
  selectIsLoggedIn,
} from '../../../core/auth/selectors/auth.selector';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AppConstants } from '../../../core/constants/app.constants';
import { EventsState } from '../../../core/reducers';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { SocketService } from '../../../core/services/socket.service';
import { FirebaseService } from '../../../core/services/firebase.service';

import {
  CustomModulesModel,
  EventService,
  IComponent,
  IValidateSettingsModels,
  selectAfterLoginUrl,
  selectConferenceId,
  selectEventData,
  selectPageBody,
  selectSocailLogin,
  IPageEventSettings,
  EventFeatures,
} from '../../../core/virtual-events';
import {
  GetLayoutSettingsCompletedAction,
  ResetLayoutSettingsAction,
  SetAppStats,
} from '../../../core/virtual-events/actions/app.actions';
import {
  HideSpinnerAction,
  ShowSpinnerAction,
} from '../../../core/virtual-events/actions/spinner.actions';
import { EventTypes } from '../../../core/virtual-events/enums/event-types.enum';
import { PageIdsEnum } from '../../../core/virtual-events/enums/page-ids.model';
import { selectHasPaidAccess } from '../../../core/virtual-events/selectors/app.selectors';
import { json2xml } from 'xml-js';
import { aoiOnFirstLogin } from '../../../core/utils/common.functons';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent extends BaseComponent implements OnInit, OnDestroy {
  customModules: Array<CustomModulesModel> = [];
  nonCustomModules: Array<IComponent> = [];
  customHtmlById: { [id: string]: string } = {};
  isBannerAvailable = false;
  banner: any;

  conferenceId: number;
  loginForm: FormGroup;
  forgotForm: FormGroup;
  userModel: UserTokenModel;
  githubUrl: string;
  atdLoginUrl: string;
  code: string;
  apiUrl: string = environment.API_URL;
  email: string = environment.production ? '' : '';
  password: string = environment.production ? '' : '';
  isForgotFlow = false;
  showInvalid = false;
  afterLoginUrl: string;
  returnUrl: string;
  isUnAuthorized = false;
  isUnAuthorizedShrm = false;
  socialLogins: any = {};
  groupId = Guid.create().toString();
  colonialsWeekend = AppConstants.ColonialsWeekend;
  content: IComponent;
  footer: any;
  header: any;
  clioCon2020 = AppConstants.ClioCon2020;
  aasp = AppConstants.aasp;
  mefforum = AppConstants.mefforum;
  isChecked = false;
  forgotpassword: any;
  social: any;
  showError: boolean = false;
  openForm: boolean = false;
  @ViewChild('emailFocus') emailFocus: ElementRef;
  @ViewChild('passwordFocus') passwordFocus: ElementRef;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private socket: SocketService,
    private appService: EventService,
    private spinner: NgxSpinnerService,
    private firebaseService: FirebaseService
  ) {
    super(store, route, router, localStorage);

    this.githubUrl = `${environment.AUTHORIZE_URL
      }?scope=user%3Aemail&client_id=${environment.CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        environment.REDIRECT_URI
      )}&state=${Guid.create()}`;

    this.atdLoginUrl = `${environment.ATDAuthorizeUrl}?pnid=${environment.ATDClientId
      }&CallbackUrl=${encodeURIComponent(environment.REDIRECT_URI)}`;
  }

  ngOnInit() {
    super.ngOnInit();

    if (this.eventData.conferenceId === AppConstants.atdvirtualconference) {
      if (this.localStorage.getRemove('unAuthorized'))
        this.isUnAuthorized = true;
    }

    if (
      this.eventData?.conferenceId === AppConstants.SHRM ||
      this.eventData?.conferenceId === AppConstants.SHRMHRPS ||
      this.eventData?.conferenceId === AppConstants.shrminclusion
    ) {
      if (this.localStorage.getRemove('unAuthorized'))
        this.isUnAuthorizedShrm = true;
    }

    this.loginForm = this.fb.group({
      email: [this.email, [Validators.required, Validators.email]],
      password: [this.password, [Validators.required]],
      terms: [false],
    });

    combineLatest(
      this.store.select(selectHasPaidAccess),
      this.store.select(selectIsLoggedIn),
      this.store.select(selectConferenceId),
      this.store.select(selectAfterLoginUrl),
      this.store.select(selectSocailLogin)
    )
      .pipe(
        filter(
          (f) =>
            f[0] !== undefined &&
            f[1] !== undefined &&
            Boolean(f[2] && f[3] && f[4])
        ),
        tap(([paidAccess, loggedin, cfid, afterLogin, social]) => {
          if (paidAccess && loggedin && afterLogin) {
            setTimeout(
              () => this.router.navigateByUrl(afterLogin.toLowerCase()),
              0
            );
            return;
          }

          this.conferenceId = cfid;
          this.loadCustomModules();
          this.afterLoginUrl = afterLogin;

          this.socialLogins = social['socialLogins'];
          this.forgotpassword = social['forgotpassword'];
          if (this.socialLogins.social27 === undefined) {
            this.socialLogins.social27 = true;
          }
          this.social = social;


          this.cdr.markForCheck();
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe();

    this.store
      .select(selectCurrentUser)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        if (user) {
          if (
            user.userTypeId === UserType.Moderator ||
            user.userTypeId === UserType.Creator
          ) {
            const groupKey =
              AppConstants.moderatorKey + this.eventData.conferenceId;
            // this.socket.registerUserSpecificSocket(groupKey, user.userId);
            this.socket.registerRoleSpecificSocket(groupKey, user.userId);
            this.cdr.markForCheck();
          }
        }
      });

    this.route.queryParams.pipe(takeUntil(this.unsubscribe)).subscribe((s) => {
      this.returnUrl = s.returnUrl;
    });

    combineLatest(
      this.store.select(selectEventData),
      this.store.select(selectPageBody),
      this.store.select(selectIsLoggedIn)
    )
      .pipe(
        filter((f) => Boolean(f[0] && f[1] && f[2])),
        tap(([dpage, body, login]) => {
          const json = JSON.parse(dpage.defaultPage) as [
            { name: string; type: number; id: number; url: string }
          ];
          if (json) {
            let page = body.pages.find((f) => f.pageId === json[0]?.id);
            if (page?.isPublished !== false && login) {
              this.gotToDefaultPage();
            }
          }
          this.cdr.markForCheck();
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe();

    this.setStats('IN');
  }

  trackByIndex(index: number): number {
    return index;
  }

  loadCustomModules(): void {
    // this.spinner.show();
    this.appService
      .getCustomModules(this.eventData.conferenceId, PageIdsEnum.Login)
      .subscribe(
        (res) => {
          this.customModules = (res.entity as unknown) as Array<
            CustomModulesModel
          >;

          if (this.pageBody) {
            const components = this.pageBody.pages.find(
              (e) => e.pageId === PageIdsEnum.Login
            )?.components;
            this.nonCustomModules = components;

            this.banner = components?.find((e) => e.name == 'ng-banner');
            this.nonCustomModules.forEach((element) => {
              if (element.name == 'ng-signin') {
                this.footer =
                  element.footer !== undefined ? element.footer : '';
                this.header =
                  element.header !== undefined ? element.header : '';
              }
            });
            // this.content = components?.find(e => e.name == 'ng-signin');
            this.isBannerAvailable = Boolean(this.banner);
          }
          this.cdr.markForCheck();
        },
        (e) => {
          this.spinner.hide();
        },
        () => {
          this.spinner.hide();
        }
      );
  }

  onSubmit() {
    if (!this.loginForm.valid) {
      if (this.loginForm.controls.password.invalid)
        this.passwordFocus.nativeElement.focus();
      if (this.loginForm.controls.email.invalid)
        this.emailFocus.nativeElement.focus();
      return;
    }
    if (this.eventData.conferenceId === AppConstants.mefforum) {
      if (this.loginForm.controls.terms.value !== true) {
        this.showError = true;
        return;
      }
    }

    const email = this.loginForm.get('email').value;
    const pwd = this.loginForm.get('password').value;
    this.showInvalid = false;

    this.store.dispatch(new ShowSpinnerAction({ name: 'onSubmit' }));
    this.authService
      .login(this.conferenceId, email, pwd)
      .pipe(
        catchError((err) => {
          this.toaster.error(
            'Email or password are incorrect. ',
            'Validation failed!',
            {
              timeOut: 3000,
              positionClass: 'toast-top-left',
            }
          );
          return throwError(err);
        }),
        tap((res) => {
          if (this.isSuccess(res)) {
            this.userModel = (res.entity as unknown) as UserTokenModel;
            let user = (Object.assign(
              {},
              { ...res.entity }
            ) as unknown) as UserTokenModel;
            user.pageEventSettings = null;
            const obj = (res.entity.pageEventSettings as unknown) as any;
            var result = {
              code: res.code,
              message: res.message,
              entity: obj,
            } as IValidateSettingsModels;

            const notPaidAccess = Boolean(
              obj &&
              obj.eventData &&
              obj.eventData.eventTypeId === EventTypes.Paid &&
              obj.pageEventSettings &&
              !obj.pageEventSettings.hasPaidAccess
            );

           
            const eventName = result.entity.eventData.eventUrlName;

            this.store.dispatch(new Register({ authUser: user }));
            this.store.dispatch(
              new UserLoaded({ user: user.userProfile as CurrentUser })
            );
            this.store.dispatch(new ResetLayoutSettingsAction({ eventName }));
            this.cdr.markForCheck();
            this.store.dispatch(
              new GetLayoutSettingsCompletedAction({ eventName, result })
            );

            if (!this.socket.isSocketInitialized(false)) {
              this.socket.registerUserSpecificSocket(
                this.eventData.conferenceId,
                this.userModel.userId,
                true
              );
            }

            if (
              AppConstants.microsoftAgmSummit === this.conferenceId &&
              !user?.userProfile?.isMyAgendaExists
            ) {
              return this.router.navigateByUrl(
                `/${this.eventData.eventUrlName}/agenda/build-agenda`
              );
            }

            if (notPaidAccess) {
              return this.router.navigateByUrl(
                `/${this.eventData.eventUrlName}/auth/upgrade`
              );
            }

            if (aoiOnFirstLogin(obj.pageEventSettings as IPageEventSettings)) {
              if (res.entity.isFirstLogin === false) {
                setTimeout(() => {
                  this.router.navigateByUrl(
                    `/${this.eventData?.eventUrlName}/personalized`
                  );
                }, 0);
                return;
              } else {
                 setTimeout(() => {
                  this.router.navigateByUrl(this.afterLoginUrl);
                }, 0);

                return;
              }
            } else {
              if (this.returnUrl) {
                this.router.navigateByUrl(this.returnUrl.toLowerCase());
              } else if (this.afterLoginUrl) {
                this.router.navigateByUrl(this.afterLoginUrl.toLowerCase());
              } else {
                this.router.navigateByUrl(
                  `/${this.eventData.eventUrlName}/home`
                );
              }
            }
          } else {
            this.store.dispatch(new HideSpinnerAction({ name: 'onSubmit' }));
            this.toaster.error(
              'Your login was unsuccessful, Your username or password is invalid.',
              '',
              {
                timeOut: 2000,
                positionClass: 'toast-top-left',
              }
            );
          }
          this.cdr.markForCheck();
        }),
        takeUntil(this.unsubscribe),
        finalize(() => {
          this.store.dispatch(new HideSpinnerAction({ name: 'onSubmit' }));
          this.cdr.markForCheck();
        })
      )
      .subscribe();
  }

  isTableau(event: any) {
    return true;
  }

  getControl(controlName: string) {
    return this.loginForm.get(controlName);
  }

  isAamc() {
    return this.eventData.conferenceId === AppConstants.aamc
  }
  forgotPassword() {
    if (this.isAamc()) {
      window.open(`https://www.cvent.com/Events/Register/RegNumConfirmation.aspx?e=91e0769f-ce64-4654-802a-6a63de8b32d4`, '_blank');
    } else {
      this.router.navigateByUrl(
        `/${this.confereceUrlName}/auth/forgot-password`
      );
    }
  }

  gotoSignup() {
    this.router.navigateByUrl(`/${this.confereceUrlName}/auth/register`);
  }

  gotGithub() {
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('github', AppConstants.authTypeKey);

    window.location.href = this.githubUrl;
  }

  gotMSOffice() {
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('windowsliveuser', AppConstants.authTypeKey);

    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/ms`);
  }

  goATD() {
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('atd', AppConstants.authTypeKey);
    this.localStorage.set(this.returnUrl, AppConstants.returnUrl);
    window.location.href = this.atdLoginUrl;
  }

  gotSAML() {
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/saml`);
  }

  gotoULI() {
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/uli`);
  }

  get isULI() {
    return (
      this.eventData.conferenceId === AppConstants.uli ||
      this.eventData.conferenceId === AppConstants.uli_test
    );
  }

  gotoB2C() {
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('b2c', AppConstants.authTypeKey);
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/b2c`);
  }


  ngOnDestroy() {
    super.ngOnDestroy();
    this.setStats('OUT');
  }

  setStats(vType: string) {
    let sessionId = this.getWithExpiry();
    if (!sessionId) {
      const now = new Date();
      sessionId = Guid.create().toString();

      // `item` is an object which contains the original value
      // as well as the time when it's supposed to expire
      const item = {
        value: sessionId,
        expiry: now.getTime() + 2.16e7,
      };
      localStorage.setItem('StatsSessionId', JSON.stringify(item));
    }

    if (vType === 'IN') {
      this.previousUrl = this.document.referrer.replace(
        window.location.origin,
        ''
      );
      this.currentUrl = window.location.href.replace(
        window.location.origin,
        ''
      );

      this.store.dispatch(
        new SetAppStats({
          eventId: this.eventData.conferenceId,
          stateObj: {
            UserId: this.userId,
            SectionId: 12,
            SectionBasedId: PageIdsEnum.Login,
            Previouspagelink: this.previousUrl,
            CurrentPageLink: this.currentUrl,
            PageUrl: this.currentUrl,
            UserSessions: sessionId,
            BrowserInfo: this.getBrowser(),
            OSInfo: this.getOS(),
            visitType: vType,
            visitTypeGroup: this.groupId,
          },
        })
      );
    } else {
      const previousUrl = this.document.referrer.replace(
        window.location.origin,
        ''
      );
      const currentUrl = window.location.href.replace(
        window.location.origin,
        ''
      );

      this.store.dispatch(
        new SetAppStats({
          eventId: this.eventData.conferenceId,
          stateObj: {
            UserId: this.userId,
            SectionId: 12,
            SectionBasedId: PageIdsEnum.Login,
            Previouspagelink: this.currentUrl,
            Nextpagelink: currentUrl,
            CurrentPageLink: this.currentUrl,
            PageUrl: this.currentUrl,
            UserSessions: sessionId,
            BrowserInfo: this.getBrowser(),
            OSInfo: this.getOS(),
            visitType: vType,
            visitTypeGroup: this.groupId,
          },
        })
      );
    }
  }

  getSignupLabel(str: string) {
    if (AppConstants.tauc === this.eventData.conferenceId)
      return 'Register Now';
    else if (AppConstants.aamc === this.eventData.conferenceId) {
      return 'Create an account';
    } else return str;
  }

  needCheck() {
    if (
      this.eventData.conferenceId === AppConstants.ClioCon2020 ||
      this.eventData.conferenceId === AppConstants.aasp
    ) {
      return true;
    }
    return false;
  }

  get hideLable() {
    if (
      this.social?.showSignUp === false ||
      this.eventData.conferenceId === AppConstants.ms1es ||
      this.eventData.conferenceId === AppConstants.RealComm ||
      this.eventData.conferenceId === AppConstants.ITSMA ||
      this.eventData.conferenceId === 4077 ||
      this.eventData.conferenceId === AppConstants.aamc
    ) {
      return false;
    }
    return true;
  }

  get isms1es() {
    return this.eventData.conferenceId === AppConstants.ms1es;
  }
}
