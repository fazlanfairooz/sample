import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/services/auth.service';
import { EventsState } from '../../../core/reducers';
import { Store } from '@ngrx/store';
import { tap, takeUntil, finalize, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { BaseComponent } from '../../../core/components/base/base.component';
import { Guid } from 'guid-typescript';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';
import { ToastrService } from 'ngx-toastr';
import { CustomModulesModel, IComponent, EventService, selectConferenceId } from '../../../core/virtual-events';
import { DOCUMENT } from '@angular/common';
import { SetAppStats } from 'src/app/core/virtual-events/actions/app.actions';
import { PageIdsEnum } from 'src/app/core/virtual-events/enums/page-ids.model';
import { AppConstants } from 'src/app/core/constants/app.constants';


@Component({
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent extends BaseComponent implements OnInit {
  customModules: Array<CustomModulesModel> = [];
  nonCustomModules: Array<IComponent> = [];
  customHtmlById: { [id: string]: string } = {};
  isBannerAvailable = true;
  banner: any;

  conferenceId: number;
  forgotForm: FormGroup;
  @ViewChild('email') email:ElementRef;

  constructor(
    private spinner: NgxSpinnerService,
    private appService: EventService,
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    private toaster: ToastrService,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private fb: FormBuilder,
    @Inject(DOCUMENT) document: Document
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit() {
    super.ngOnInit();
    this.loadCustomModules();

    this.store.select(selectConferenceId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(cid => {
        this.conferenceId = cid;
      });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (!this.forgotForm.valid) {
      this.email.nativeElement.focus();
      return;
    }
    const email = this.forgotForm.get('email').value;

    const spinnerId = Guid.create().toString();
    this.store.dispatch(new ShowSpinnerAction({ name: spinnerId }));
    this.authService
      .forgotPassword(this.conferenceId, email)
      .pipe(
        catchError(err => {
          this.toaster.error('Email or password are incorrect. ', 'Error!', {
            timeOut: 3000,
            positionClass: 'toast-top-left'
          });
          return throwError(err);
        }),
        tap(res => {
          if (res.code === 200) {
            this.resetFormStatus();

            this.toaster.success(`Your request has been processed. In order to maintain the security of your account,
              you will receive an email containing a verification code and a link that will allow you to set a new password.
              You must follow the instructions in the email in order to set a new password.`, '', {
              timeOut: 7000,
              positionClass: 'toast-top-left'
            }).onHidden.subscribe(() => {
              this.gotoLogin();
            });

          } else {
            this.toaster.error(
              `Provided email does not exist`,
              'Error!',
              {
                timeOut: 2000,
                positionClass: 'toast-top-left'
              }
            );
          }
        }),
        takeUntil(this.unsubscribe),
        finalize(() => {
          this.store.dispatch(new HideSpinnerAction({ name: spinnerId }));
          this.cdr.markForCheck();
        })
      )
      .subscribe();
  }



  loadCustomModules(): void {
    this.spinner.show();
    this.appService.getCustomModules(this.eventData.conferenceId, this.pageId).subscribe((res) => {
      this.customModules = res.entity as unknown as Array<CustomModulesModel>;

      const components = this.pageBody.pages.find(e => e.pageId === this.pageId).components;
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
      this.cdr.markForCheck();
    },
      (e) => {
        this.spinner.hide();
      },
      () => {
        this.spinner.hide();
      });
  }

  resetFormStatus() {
    this.forgotForm.get('email').setValue('');
    this.forgotForm.get('email').clearValidators();
    this.forgotForm.get('email').updateValueAndValidity();
  }

  getControl(controlName: string) {
    return this.forgotForm.get(controlName);
  }

  gotoLogin() {
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/auth`);
  }

  getDescription() {
    if (this.eventData.conferenceId === AppConstants.CAP20) {
      return 'Enter the email address you registered with and we will email you a link to create or reset your password so you can access the CAP20 Virtual platform.'
    }
    return 'No problem — just enter your email address below and we’ll email you a link to reset your password.'
  }

  getHeading() {
    if (this.eventData.conferenceId === AppConstants.CAP20) {
      return 'Create or Update Your Password'
    }
    return 'Request New Password'
  }
}

