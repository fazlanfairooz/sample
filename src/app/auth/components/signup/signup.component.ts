import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { Store } from '@ngrx/store';
import { NgxSpinnerService } from 'ngx-spinner';
import { Guid } from 'guid-typescript';
import { EventsState } from '../../../core/reducers';
import { BaseComponent } from '../../../core/components/base/base.component';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { PageIdsEnum } from '../../../core/virtual-events/enums/page-ids.model';
import { CustomModulesModel, IComponent, EventService } from '../../../core/virtual-events';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { AppConstants } from '../../../core/constants/app.constants';

@Component({
  selector: 'de-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  // encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent extends BaseComponent implements OnInit {
  customModules: Array<CustomModulesModel> = [];
  nonCustomModules: Array<IComponent> = [];
  isNewUser = false;
  githubUrl: string;
  atdLoginUrl: string;
  socialLogins
  isBannerAvailable = true;
  regBannerUrl: any;
  constructor(
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private appService: EventService,
    private spinner: NgxSpinnerService) {
    super(store, route, router, localStorage);
  }

  ngOnInit() {
    super.ngOnInit();
    this.githubUrl = `${environment.AUTHORIZE_URL}?scope=user%3Aemail&client_id=${
      environment.CLIENT_ID
      }&redirect_uri=${encodeURIComponent(environment.REDIRECT_URI)}&state=${Guid.create()}`;
    this.atdLoginUrl = `${environment.ATDAuthorizeUrl}?pnid=${
      environment.ATDClientId
      }&CallbackUrl=${encodeURIComponent(environment.REDIRECT_URI)}`;

    if (this.eventData) {
      this.loadCustomModules();
    }
  }

  gotoRegisterForm() {
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/register`);
  }

  gotoLoginForm() {
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth`);
  }

  gotLinkedIn() {
    return;
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('linkedin', AppConstants.authTypeKey);
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth`);
  }

  gotGithub() {
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('github', AppConstants.authTypeKey);

    window.location.href = this.githubUrl;
  }

  gotSAML(){
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/saml`);
  }

  gotMSOffice() {

    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('windowsliveuser', AppConstants.authTypeKey);

    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/ms`);
  }

  goATD() {
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('atd', AppConstants.authTypeKey);
    window.location.href = this.atdLoginUrl;
  }

  gotoB2C() {
    this.localStorage.set(this.eventData.eventUrlName, AppConstants.eventKey);
    this.localStorage.set('b2c', AppConstants.authTypeKey);
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/b2c`);
  }

  trackByIndex(index: number): number {
    return index;
  }

  loadCustomModules(): void {
    // this.spinner.show();
    this.appService.getCustomModules(this.eventData.conferenceId, PageIdsEnum.Login).subscribe((res) => {
      this.customModules = res.entity as unknown as Array<CustomModulesModel>;

      if (this.pageBody) {
        const components = this.pageBody.pages.find(e => e.pageId === PageIdsEnum.Login)?.components;

        var banner = components.find(e => e.name == 'ng-banner');
        if (banner == undefined) {
          this.isBannerAvailable = false;
        } else {
          this.isBannerAvailable = true;
        }

        var body = components.find(e => e.name == 'ng-signin');
        this.socialLogins = body["socialLogins"] as { key: string, val: boolean }[];
        var trueVals = [];

        if (trueVals.length <= 1) {
          this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/register`);
          return;
        }

        this.nonCustomModules = components;
        this.regBannerUrl = this.nonCustomModules.find(a=> a.name === 'ng-banner').banner;
        this.cdr.markForCheck();
      }
    },
      (e) => {
        this.spinner.hide();
      },
      () => {
        this.spinner.hide();
      });
  }
}
