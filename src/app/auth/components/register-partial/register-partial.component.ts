import { NgForm } from '@angular/forms';
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, Input, ViewEncapsulation, OnInit, OnChanges, Inject, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from '../../../core/components/base/base.component';
import { CountryModel, StateModel } from '../../../core/models/static-data.model';
import { DynamicRegisterFieldsModel } from '../../../core/models/dynamic-register-fields.model';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { EventsState } from '../../../core/reducers';
import { EnumAuthMode } from '../../../core/enums/auth-mode.enum';
import { Login, UserLoaded, Register } from '../../../core/auth/actions/auth.action';
import { AuthService } from '../../../core/auth/services/auth.service';

import { SocketService } from '../../../core/services/socket.service';
import { UserTokenModel } from '../../../core/auth/models/user-token.model';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';
import { throwError, combineLatest } from 'rxjs';
import { Guid } from 'guid-typescript';
import * as _ from 'lodash';
import { selectAfterLoginUrl, selectEventData, EventTicketModel, IValidateSettingsModels, GetLayoutSettingsCompletedAction } from '../../../core/virtual-events';
import { EventTypes } from '../../../core/virtual-events/enums/event-types.enum';
import { tap, takeUntil, filter, catchError, finalize } from 'rxjs/operators';
import { CurrentUser } from '../../../core/auth/models/current-user.model';
import { ResetLayoutSettingsAction } from '../../../core/virtual-events/actions/app.actions';
import { AppConstants } from 'src/app/core/constants/app.constants';

@Component({
  selector: 'signup-partial',
  templateUrl: './register-partial.component.html',
  styleUrls: ['./register-partial.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPartialComponent extends BaseComponent implements OnInit {
  @Output() ticketSelected = new EventEmitter<any>();

  @Input() registerFields: DynamicRegisterFieldsModel[];
  @Input() orgRegisterFields: DynamicRegisterFieldsModel[] = [];
  @Input() login?: string;
  @Input() photoPath?: string;
  @Input() socialId?: string;
  @Input() authMode?: number;
  @Input() code?: string;
  @Input() state?: string;
  @Input() countryOptions: CountryModel[];
  @Input() stateOptions: StateModel[];
  confirmPassword: string;
  afterLoginUrl: any;
  eventTypeId: EventTypes;
  package: EventTicketModel;
  currentUser: CurrentUser;

  campaignFields = {
    cm_status: '',
    campaign_id: '',
    lead_source: '',
    lead_source_detail: '',
    utm_campaign: '',
    utm_campaign_id: '',
    utm_medium: '',
    utm_source: '',
    utm_language: '',
    utm_country: '',
    partner_code: '',
    kw: '',
    adgroup: '',
    adused: '',
    matchtype: '',
    placement: '',
  };


  constructor(
    store: Store<EventsState>,
    private toaster: ToastrService,
    private authService: AuthService,
    route: ActivatedRoute,
    router: Router,
    localStorage: LocalStorageService,
    private socket: SocketService,
    private cdr: ChangeDetectorRef
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit() {

    this.route.queryParams.pipe(takeUntil(this.unsubscribe)).subscribe((p) => {
      this.campaignFields.cm_status = p['cm_status'];
      this.campaignFields.campaign_id = p['campaign_id'];
      this.campaignFields.lead_source = p['lead_source'];
      this.campaignFields.lead_source_detail = p['lead_source_detail'];
      this.campaignFields.utm_campaign = p['utm_campaign'];
      this.campaignFields.utm_campaign_id = p['utm_campaign_id'];
      this.campaignFields.utm_medium = p['utm_medium'];
      this.campaignFields.utm_source = p['utm_source'];
      this.campaignFields.utm_language = p['utm_language'];
      this.campaignFields.utm_country = p['utm_country'];
      this.campaignFields.partner_code = p['partner_code'];
      this.campaignFields.kw = p['kw'];
      this.campaignFields.adgroup = p['adgroup'];
      this.campaignFields.adused = p['adused'];
      this.campaignFields.matchtype = p['matchtype'];
      this.campaignFields.placement = p['placement'];

      this.cdr.markForCheck();
    });

    combineLatest([
      this.store.select(selectAfterLoginUrl),
      this.store.select(selectEventData)
    ]).pipe(
      filter(f => !!(f[0]) && !!(f[1])),
      tap(([url, edata]) => {
        this.afterLoginUrl = url;
        this.eventTypeId = edata.eventTypeId;
        this.cdr.markForCheck();
      }),
      takeUntil(this.unsubscribe),
    ).subscribe();
  }

  submitForm(registerForm: NgForm) {
    const model = JSON.parse(JSON.stringify(this.registerFields)) as DynamicRegisterFieldsModel[];
    let isValid = model.some(s => (s.isMandatory && !s.fieldValue) || (s.controlCode === 'DD' && s.isMandatory && this.isOtherOptionSelected(s) && !s.fieldOtherValue)) === false;
    if (isValid) {
      isValid = this.validateEmail(model.find(s => s.validationType === 'Email').fieldValue);
      if (isValid) {
        isValid = this.isMatching(model.find(s => s.controlCode === 'PWD'));
      }
    }

    if (!isValid) {
      window.scroll(0, 200);
      return;
    }

    const spinnerId = Guid.create().toString();
    this.store.dispatch(new ShowSpinnerAction({ name: spinnerId }));
    this.authService.saveRegisterData(this.eventData.conferenceId, this.prepareResponse(model))
      .pipe(
        catchError(err => {
          this.toaster.error('One or more error occured while processing your request. Please try again later.', 'Registration failed!', {
            timeOut: 3000,
            positionClass: 'toast-top-left'
          });
          return throwError(err);
        }),
        tap(res => {

          this.store.dispatch(new HideSpinnerAction({ name: spinnerId }));
          if (res.code === 200) {
            if (!res.entity) {
              this.toaster.info('You are registered successfully.', 'Success!', {
                timeOut: 3000,
                positionClass: 'toast-top-left'
              });
              this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth`);
              return;
            }

            let user = Object.assign({}, { ...res.entity }) as unknown as UserTokenModel;
            user.pageEventSettings = null;
            const obj = res.entity.pageEventSettings as unknown as any;
            var result = {
              code: res.code,
              message: res.message,
              entity: obj
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
            this.store.dispatch(new UserLoaded({ user: user.userProfile as CurrentUser }));
            this.store.dispatch(new ResetLayoutSettingsAction({ eventName }));
            this.store.dispatch(new GetLayoutSettingsCompletedAction({ eventName, result }));
            this.cdr.markForCheck();

            //if (notPaidAccess) {
            //  return this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/upgrade`);
            //}

            this.processRedirect(user);

          } else if (res.code === -2 || res.code === -5) {
            this.toaster.info('You are already registered with provided email.', 'Info!', {
              timeOut: 2000,
              positionClass: 'toast-top-left'
            });
          } else {
            this.toaster.error('An error occured while process your request. Please try again later.', 'Error!', {
              timeOut: 2000,
              positionClass: 'toast-top-left'
            });
          }
          this.cdr.markForCheck();
        }),
        takeUntil(this.unsubscribe),
        finalize(() => {
          this.store.dispatch(new HideSpinnerAction({ name: spinnerId }));
          this.cdr.markForCheck();
        })
      )
      .subscribe();
  }

  processRedirect(user: UserTokenModel) {
    if (this.eventTypeId == EventTypes.Paid && this.package.price) {
      this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/checkout/${this.package.id}`); // Main page
      return;
    }

    if (this.afterLoginUrl) {
      this.store.dispatch(new Login({ authUser: user, eventId: this.eventData.conferenceId }));
      if (!this.socket.isSocketInitialized(false)) {
        this.socket.registerUserSpecificSocket(this.eventData.conferenceId, user.userId);
      }

      this.router.navigateByUrl(this.afterLoginUrl); // Main page
    }
    else {
      this.store.dispatch(new Login({ authUser: user, eventId: this.eventData.conferenceId }));

      this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth/thankyou`); // Main page
      return;
    }
  }

  getGroups() {
    return _.unionBy(this.registerFields, 'groupId');
  }

  controlTouched(field: DynamicRegisterFieldsModel) {

    if (field.controlCode !== 'DD') {
      field.invalid = field.isMandatory && !this.trimField(field.fieldValue, field.controlCode) ? true : false;
      this.isRequired(field);
      this.cdr.markForCheck();
    } else {
      if (this.isOtherOptionSelected(field)) {
        field.otherInvalid = field.isMandatory && !this.trimField(field.fieldOtherValue, field.controlCode) ? true : false;

      } else {
        field.invalid = field.isMandatory && !this.trimField(field.fieldValue, field.controlCode) ? true : false;
        this.isRequired(field);
        this.cdr.markForCheck();
      }
    }
  }

  getSectionByGroupId(groupId: number) {
    return this.registerFields.filter(f => f.groupId === groupId);
  }

  isRequired(field: DynamicRegisterFieldsModel) {
    this.isMatching();
    if (field.isMandatory) {
      field.messageText = 'This field is Required';
      if (field.controlCode === 'TXT') {
        if (field.validationType === 'Email') {
          if (_.isEmpty(field.fieldValue)) {
            return _.isEmpty(this.trimField(field.fieldValue, field.controlCode));
          } else {
            if (!this.validateEmail(field.fieldValue)) {
              field.messageText = 'Enter a valid email.';
              return true;
            } else {
              field.messageText = 'This field is Required';
              return false;
            }
          }
        } else {
          if (field.validationType === 'PWD') {
            if (_.isEmpty(this.trimField(field.fieldValue, field.controlCode))) {
              return _.isEmpty(this.trimField(field.fieldValue, field.controlCode));
            } else {
              return field.fieldValue, this.confirmPassword;
            }
          }
          return _.isEmpty(this.trimField(field.fieldValue, field.controlCode));
        }
      } else {
        return field.isMandatory && !this.trimField(field.fieldValue, field.controlCode);
      }
    } else {
      return false;
    }
  }

  isOtherRequired(field: DynamicRegisterFieldsModel) {
    let fieldVal = this.trimField(field.fieldOtherValue, field.controlCode);

    return field.isMandatory && !fieldVal;
  }

  trimField(value: string, code: string) {
    let fieldValue;

    try {
      if (!(code == 'CB' || code === 'AGT')) {
        fieldValue = value?.trim();
        return fieldValue;
      }
    } catch (e) {
    }
    return value;
  }

  prepareResponse(fields: DynamicRegisterFieldsModel[]): any {
    const response: any = {};
    const customAnswers = [];
    response.authMode = EnumAuthMode[this.socialId];
    response.login = this.login;
    response.photoPath = this.photoPath;
    response.campaignFields = this.campaignFields;
    response.ticketId = this.package?.id;

    fields.forEach(f => {
      if (f.mappingField.indexOf('custom') === -1) {
        response[f.mappingField] = f.fieldValue;
      } else {
        const customAnswer: any = {};
        if (f.controlCode === 'CB') {

          const options = f.options.filter(f => f.selected) as { id: number, value: string, selected: boolean }[];
          options.forEach(o => {
            customAnswers.push({
              questionId: f.questionId,
              answerId: o.id,
              isUserAnswer: false,
              sectionId: f.sectionId
            });
          });

        } else if (f.controlCode === 'RD') {
          if (f.fieldValue) {
            if (this.isOtherOptionSelected(f)) {
              customAnswer.answerText = f.fieldOtherValue;
              customAnswer.isUserAnswer = true;
            } else {
              customAnswer.answerId = f.fieldValue;
              customAnswer.isUserAnswer = false;
            }
            customAnswer.questionId = f.questionId;
            customAnswer.sectionId = f.sectionId;
          }
        } else if (f.controlCode === 'DD') {
          if (f.fieldValue) {
            if (this.isOtherOptionSelected(f)) {
              customAnswer.answerText = f.fieldOtherValue;
              customAnswer.isUserAnswer = true;
            } else {
              customAnswer.answerId = f.fieldValue;
              customAnswer.isUserAnswer = false;
            }
            customAnswer.questionId = f.questionId;
            customAnswer.sectionId = f.sectionId;
          }
        }

        else if (f.controlCode === 'AGT') {
          if (f.fieldValue) {
            customAnswer.questionId = f.questionId;
            customAnswer.answerId = _.first(f.options)?.id;
            customAnswer.fieldValue = _.first(f.options)?.id;
            customAnswer.isUserAnswer = false;
            customAnswer.sectionId = f.sectionId;
          }
        }
        else {
          customAnswer.questionId = f.questionId;
          customAnswer.answerId = f.controlCode === 'TXT' || f.controlCode === 'TA' ? 0 : f.fieldValue,
            customAnswer.answerText = f.controlCode === 'TXT' || f.controlCode === 'TA' ? f.fieldValue : '',
            customAnswer.isUserAnswer = f.controlCode === 'TXT' || f.controlCode === 'TA' ? true : false;
          customAnswer.sectionId = f.sectionId;
        }
        if (!_.isEmpty(customAnswer)) {
          customAnswers.push(customAnswer);
        }
      }
    });
    response.customAnswers = customAnswers;
    return response;
  }

  getStates() {
    const country = this.registerFields.find(f => f.controlCode === 'CNTA');
    if (country) {
      return this.stateOptions.filter(f => f.countryId === parseInt(country.fieldValue, 10));
    }

    return [];
  }

  validateEmail(email: string) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  clearState() {
    const state = this.registerFields.find(f => f.controlCode === 'STA');
    // state.fieldValue = '';
  }

  getFieldOptions(field: DynamicRegisterFieldsModel) {
    const optionText = field.optionText.split('|');
    const options = [];
    optionText.forEach(o => {
      options.push({
        id: _.last(o.split('*')),
        value: _.unescape(_.first(o.split('*')))
      });
    });

    return options;
  }

  isMatching(field?: DynamicRegisterFieldsModel) {
    if (_.isEmpty(field)) {
      field = this.registerFields.find(s => s.controlCode === 'PWD');
    }

    if (field) {
      return _.isEqual(this.confirmPassword, field.fieldValue);
    }
    return true;
  }

  get getAGTTQuestion(): DynamicRegisterFieldsModel {
    return this.orgRegisterFields.find(f => f.controlCode === 'AGTT') || new DynamicRegisterFieldsModel()
  }

  AGTOptionText(item: DynamicRegisterFieldsModel) {
    let text = this.orgRegisterFields.find(f => f.questionId === item.questionId).optionText;
    if (text)
      return text.indexOf('*') > -1 ? (text.split('*')[0]).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : text;
  }

  getOptionText(text: string) {
    if (text)
      return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  isOtherOptionSelected(item: DynamicRegisterFieldsModel) {
    if (item.fieldValue) {
      const option = item.options.find(f => parseInt(f.id) === parseInt(item.fieldValue)) as { id: string, value: string };
      if (option && option.value && option.value.trim().toLowerCase() === 'other') {
        return true;
      }
    }
  }

  isOtherOptionText(item: DynamicRegisterFieldsModel) {
    if (item.fieldValue) {
      const option = item.options.find(f => parseInt(f.id) === parseInt(item.fieldValue)) as { id: string, value: string };
      if (option && option.value && option.value.trim().toLowerCase() === 'other') {
        return item.fieldOtherValue;
      }
    }
  }


  returnToSignup() {
    const url = `${this.eventData.eventUrlName}/auth`;
    this.router.navigateByUrl(url);
  }

  setSelectedPackage(pId: EventTicketModel) {
    this.package = pId;
    this.ticketSelected.emit(pId);
    this.cdr.markForCheck();
  }

  get showForm(): boolean {
    if (this.eventTypeId === EventTypes.Paid && !this.package) {
      return false;
    }
    return true;
  }




}
