// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';

import * as fromComponents from './components';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MaterialModule } from '../shared/material.module';
import { AuthMainComponent } from './components/auth-main/auth-main.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { GithubRegisterComponent } from './components/github-register/github-register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { RegisterAtdComponent } from './components/register-atd/register-atd.component';
import { SharedModule } from '../shared/shared.module';
import { ThankYouPageComponent } from './components/thank-you-page/thank-you-page.component';
import { CheckoutV3Component } from './components/checkout-v/checkout-v.component';
import { AuthGuard } from '../core/auth/guards/auth.guard';
import { UpgradeSubscriptionComponent } from './components/upgrade-subscription/upgrade-subscription.component';
import { Sko21NotAvailableComponent } from './components/sko21-not-available/sko21-not-available.component';
import { RegisterSamlComponent } from './components/register-saml/register-sml.component';
import { RegisterUliComponent } from './components/register-uli/register-uli.component';
import { RegisterMsMainComponent } from './components/register-ms-main/register-ms-main.component';
import { RegisterB2CComponent } from './components/register-b2c/register-b2c.component';
// tslint:disable-next-line:class-name
const routes: Routes = [
  {
    path: '',
    component: AuthMainComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: LoginComponent
      },
      {
        path: 'login',
        pathMatch: 'full',
        component: LoginComponent
      },
      {
        path: 'signup',
        pathMatch: 'full',
        component: SignupComponent
      },
      {
        path: 'github',
        pathMatch: 'full',
        component: GithubRegisterComponent
      },
      {
        path: 'ms',
        pathMatch: 'full',
        component: RegisterMsMainComponent
      },{
        path: 'b2c',
        pathMatch: 'full',
        component: RegisterB2CComponent
      },
      {
        path: 'atd',
        pathMatch: 'full',
        component: RegisterAtdComponent
      },
      {
        path: 'saml',
        pathMatch: 'full',
        component: RegisterSamlComponent
      },
      {
        path: 'uli',
        pathMatch: 'full',
        component: RegisterUliComponent
      },
      {
        path: 'checkout/:id',
        pathMatch: 'full',
        component: CheckoutV3Component,
        canActivate: [AuthGuard],
      },
      {
        path: 'forgot-password',
        pathMatch: 'full',
        component: ForgotPasswordComponent
      },
      {
        path: 'reset-password',
        pathMatch: 'full',
        component: ResetPasswordComponent
      },
      {
        path: 'create-password',
        pathMatch: 'full',
        component: ResetPasswordComponent
      },
      {
        path: 'thankyou',
        pathMatch: 'full',
        component: ThankYouPageComponent
      },{
        path: 'upgrade',
        pathMatch: 'full',
        component: UpgradeSubscriptionComponent
      },
      {
        path: 'sko21-not-available',
        pathMatch: 'full',
        component: Sko21NotAvailableComponent
      },

    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    CarouselModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatSidenavModule,
    MaterialModule,
    MatInputModule,
    MatSelectModule,
    SharedModule
  ],
  providers: [
    // InterceptService,
    // {
    //  provide: HTTP_INTERCEPTORS,
    //  useClass: InterceptService,
    //  multi: true
    // },
    // AuthGuard
  ],
  entryComponents: [],
  declarations: [...fromComponents.components]
})
export class AuthModule {
  // static forRoot(): ModuleWithProviders {
  //  return {
  //    ngModule: AuthModule,
  //    providers: [
  //    ]
  //  };
  // }
}
