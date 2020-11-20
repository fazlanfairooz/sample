import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AuthService } from '../../../core/auth/services/auth.service';
import { EventsState } from '../../../core/reducers';
import { Store } from '@ngrx/store';
import { tap, takeUntil, finalize, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { selectConferenceId, selectEventData } from '../../../core/virtual-events/selectors/app.selectors';
import { Guid } from 'guid-typescript';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';
import { ToastrService } from 'ngx-toastr';
import { MustMatch } from '../../../core/utils/common.functons';
import { BaseComponent } from '../../../core/components/base/base.component';
import { CustomModulesModel, IComponent, EventService } from '../../../core/virtual-events';
import { LocalStorageService } from '../../../core/services/local-storage.service';

@Component({
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent extends BaseComponent implements OnInit {
  customModules: Array<CustomModulesModel> = [];
  nonCustomModules: Array<IComponent> = [];
  customHtmlById: { [id: string]: string } = {};
  isBannerAvailable = true;
  banner: any;

  conferenceId: number;
  eventUrlName: string;
  resetForm: FormGroup;
  code: string;

  constructor(
    private spinner: NgxSpinnerService,
    private appService: EventService,
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    localStorage: LocalStorageService,
    private fb: FormBuilder
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit() {
    this.loadCustomModules();

    this.store.select(selectEventData)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(data => {
        this.conferenceId = data.conferenceId;
        this.eventUrlName = data.eventUrlName;
      });

    this.route.queryParams.pipe(
      tap(q => {
        this.code = q.code;
        console.log(this.code);
        this.validateCode(this.code);
      }),
      takeUntil(this.unsubscribe),
    ).subscribe();

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validator: MustMatch('newPassword', 'confirmPassword')
    });
  }

  private validateCode(code: String) {
    const spinnerId = Guid.create().toString();
    this.authService.validateCode(this.conferenceId, this.code)
      .pipe(
        catchError(err => {
          this.toaster.error('Invalid code ', 'Error!', { timeOut: 3000, positionClass: 'toast-top-left' });
          return throwError(err);
        }),
        tap(res => {
          if (res.code === 200) {

          } else {
            this.toaster.error('Your request to reset your password has expired (or) the link has already been used.', 'Error!', { timeOut: 2000, positionClass: 'toast-top-left' });
            this.gotoLogin();
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

  private validateAreEqual(fieldControl: FormControl) {
    if (this.resetForm && fieldControl.value)
      return this.getControl('newPassword').value === this.resetForm.get('confirmPassword').value ? null : {
        NotEqual: true
      };
  }

  onSubmit() {
    this.validateAreEqual(this.getControl('confirmPassword') as FormControl);
    if (!this.resetForm.valid) {
      return;
    }
    const password = this.resetForm.get('newPassword').value;

    const spinnerId = Guid.create().toString();
    this.store.dispatch(new ShowSpinnerAction({ name: spinnerId }));
    this.authService
      .resetPassword(this.conferenceId, this.code, password)
      .pipe(
        catchError(err => {
          this.toaster.error('Invalid code ', 'Error!', {
            timeOut: 3000,
            positionClass: 'toast-top-left'
          });
          return throwError(err);
        }),
        tap(res => {
          if (res.code === 200) {
            this.resetFormStatus()
            this.toaster.success('Password updated successfully. Try login now.', '', {
              timeOut: 3000,
              positionClass: 'toast-top-left'
            }).onHidden.subscribe(() => {
              this.gotoLogin();
            });

          } else {
            this.toaster.error('Your request to reset your password has expired (or) the link has already been used.', 'Error!', { timeOut: 2000, positionClass: 'toast-top-left' });
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

  getControl(controlName: string) {
    return this.resetForm.get(controlName);
  }

  resetFormStatus() {
    this.resetForm.get('newPassword').setValue('');
    this.resetForm.get('newPassword').clearValidators();
    this.resetForm.get('newPassword').updateValueAndValidity();

    this.resetForm.get('confirmPassword').setValue('');
    this.resetForm.get('confirmPassword').clearValidators();
    this.resetForm.get('confirmPassword').updateValueAndValidity();
  }

  gotoLogin() {
    this.router.navigateByUrl(`/${this.eventUrlName}/auth`);
  }

}

