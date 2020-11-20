import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Inject, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../core/components/base/base.component';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { CountryModel, StateModel, countries, states } from '../../../core/models/static-data.model';
import { DynamicRegisterFieldsModel } from '../../../core/models/dynamic-register-fields.model';
import { Store } from '@ngrx/store';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../../../core/auth/services/auth.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { EventsState } from '../../../core/reducers';
import { SocialRegisterUser } from 'src/app/core/auth/models/social-register-user.model';
import { Guid } from 'guid-typescript';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';
import { CustomModulesModel } from '../../../core/virtual-events/models/custom-modules.model';
import { EventService } from '../../../core/virtual-events/services/app.service';
import { IComponent, IBannerItem, EventTicketModel } from '../../../core/virtual-events';
import { CurrentUser } from '../../../core/auth/models/current-user.model';
import { selectCurrentUser } from '../../../core/auth/selectors/auth.selector';
import { filter, tap, takeUntil } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'auth-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent extends BaseComponent implements OnInit {
  customModules: Array<CustomModulesModel> = [];
  nonCustomModules: Array<IComponent> = [];
  customHtmlById: { [id: string]: string } = {};
  isBannerAvailable = true;
  banner: any;
  currentUser: CurrentUser;
  selectedTicket: EventTicketModel;

  socialId: string;
  authMode: number;
  code: string;
  state: string;
  confirmPassword: string;
  countryOptions: CountryModel[] = countries;
  stateOptions: StateModel[] = states;
  orgRegisterFields: DynamicRegisterFieldsModel[] = [];
  registerFieldsModel: DynamicRegisterFieldsModel[] = [];
  socialRegisterUser: SocialRegisterUser;
  isFatalError = false;
  bannerSettings: IBannerItem;
  groupId = Guid.create().toString();

  constructor(
    private appService: EventService,
    store: Store<EventsState>,
    private authService: AuthService,
    route: ActivatedRoute,
    router: Router,
    localStorage: LocalStorageService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.store.select(selectCurrentUser).pipe(
      filter(f => !!f), tap(res => {
        this.currentUser = res;
        this.cdr.markForCheck();
      }),
      takeUntil(this.unsubscribe),
    ).subscribe();

    this.loadCustomModules();
    this.getSignupFormFiels();
    this.cdr.markForCheck();
    this.getSignupFormFiels();
    this.cdr.markForCheck();
  }

  getSignupFormFiels() {
    const spinnerId = Guid.create().toString();
    this.store.dispatch(new ShowSpinnerAction({ name: spinnerId }));

    this.authService
      .getRegisterFormData(this.eventData.conferenceId)
      .toPromise()
      .then(r => {
        const fieldModel = (r[0].entity as unknown) as DynamicRegisterFieldsModel[];
        this.orgRegisterFields = fieldModel;
        //this.countryOptions = (r[1].entity as unknown) as CountryModel[];
        //this.stateOptions = (r[2].entity as unknown) as StateModel[];

        this.registerFieldsModel = JSON.parse(JSON.stringify(this.preProcessFields(fieldModel)));
        this.cdr.markForCheck();
      })
      .finally(() => {
        this.store.dispatch(new HideSpinnerAction({ name: spinnerId }));
      });
  }

  preProcessFields(fieldsModel: DynamicRegisterFieldsModel[]) {
    const tempModel = [];

    fieldsModel.forEach(f => {
      if (f.controlCode === 'TXT') {
      } else if (f.controlCode == 'DD') {
        f.options = this.getFieldOptions(f);
      } else if (f.controlCode == 'CNTA') {
        f.options = this.countryOptions;
      } else if (f.controlCode == 'STA') {
        f.options = this.stateOptions;
      } else if (f.controlCode == 'CB') {
        f.options = this.getFieldOptions(f);
      } else if (f.controlCode == 'RD') {
        f.options = this.getFieldOptions(f);
      } else if (f.controlCode == 'AGT') {
        f.options = this.getFieldOptions(f);
      }

      f.messageText = 'This field is Required';

      if (
        !(
          (this.socialId && f.controlCode === 'PWD') ||
          f.controlCode === 'AGTT' ||
          f.mappingField === 'custom_1088'
        )
      ) {
        tempModel.push(f);
      }
    });

    return tempModel;
  }

  getFieldOptions(field: DynamicRegisterFieldsModel) {
    const optionText = field.optionText.split('|');
    const options = [];
    optionText.forEach(o => {
      options.push({
        id: _.last(o.split('*')),
        value: _.first(o.split('*'))
      });
    });

    return options;
  }

  returnToSignup() {
    const url = `${this.eventData.eventUrlName}/auth`;
    this.router.navigateByUrl(url);
  }

  loadCustomModules(): void {
    this.spinner.show();
    this.appService.getCustomModules(this.eventData.conferenceId, this.pageId).subscribe((res) => {
      this.customModules = res.entity as unknown as Array<CustomModulesModel>;

      const components = this.pageBody.pages.find(e => e.pageId === this.pageId)?.components;
      if (components) {
        this.banner = components.find(e => e.name == 'ng-banner');
        this.isBannerAvailable = Boolean(this.banner);
        this.customModules.forEach((c) => {
          const currentComponent = components.find(x => x.Id === parseInt(c.moduleId, 10));

          if (currentComponent) {
            this.appService.getModuleHtml(c.moduleHtml).subscribe((res) => {
              this.customHtmlById[c.moduleId] = res;

              this.cdr.markForCheck();
            });
          }
        });

        this.nonCustomModules = components;
        this.nonCustomModules.forEach(element => {
          if (element.name == "ng-signup") {
            this.bannerSettings = element.banner;
          }
        });
        this.cdr.markForCheck();
      } else {
        this.router.navigateByUrl(`/${this.confereceUrlName}/auth/login`);
      }
    },
      (e) => {
        this.spinner.hide();
      },
      () => {
        this.spinner.hide();
      });
  }

  onTicketSelection(ticket: EventTicketModel) {
    this.selectedTicket = ticket;
  }

  getLogo() {
    if (this.bannerSettings?.image) {
      return this.bannerSettings.image;
    }
    else {
      return this.eventData.logo;
    }
  }

}
