import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { Injector, NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { BrowserModule, HammerModule,Meta } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { NgxAgoraModule } from 'ngx-agora';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { CookieModule } from 'ngx-cookie';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { SocketIoModule } from 'ngx-socket-io';
import { NgxSpinnerModule } from 'ngx-spinner';
import { TimeagoModule } from 'ngx-timeago';
import { ToastrModule } from 'ngx-toastr';

import { environment } from '../environments/environment';
import { PagesRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthActionTypes } from './core/auth/actions/auth.action';
import { RolesGuard } from './core/auth/guards/roles.guard';
import { ServiceLocator } from './core/base/crud/models/base-service-locator';
import { CoreModule } from './core/core.module';
import * as authServices from './core/services';
import { RoundTableEffects } from './core/virtual-events';
import { RoundtablesEffects } from './core/virtual-events/effects/roundtables.effect';
import { roundtablesreducer } from './core/virtual-events/reducers/roundtables.reducer';
import { myRoundtablesReducer } from './core/virtual-events/reducers/roundtbales/my-round-table.reducer';
import { RouteResolver } from './core/virtual-events/resolvers/route.resolver';
import * as appServices from './core/virtual-events/services';
import { NotificationSocket } from './shared/classes/notification-socket.classs';
import { SharedModule } from './shared/shared.module';
import { reducers } from './store';
import { NgSlimScrollModule, SLIMSCROLL_DEFAULTS, ISlimScrollOptions } from 'ngx-slimscroll';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    s27ResourceCenterWebView: {
      logic: {
        destroy: (clearChatBot?: boolean) => void
      },
      utils: {
        pubSub: {
          subscribe(topic: string, fn): void,
          publish(topic: string, ...args): void,
          unsubscribe(topic?: string, token?: string): void,
        },
      }
    };
    playlist: (trackid: number | string, userId?: number) => void;
  }
}

function clearState(reducer) {
  return function (state, action) {

    if (action.type === AuthActionTypes.Logout) {
      state = undefined;
    }

    return reducer(state, action);
  };
}

// const socketConfig: SocketIoConfig = {
//   url: environment.socketIoUrl,
//   options: {
//     transports: ['websocket'],
//     reconnection: true,
//     autoConnect: true,
//     forceNew: true,
//     reconnectionDelay: 1000,
//     reconnectionDelayMax: 5000,
//     reconnectionAttempts: Infinity
//   }
// };

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule.withServerTransition({ appId: 'digital-events' }),
    BrowserAnimationsModule,
    HttpClientModule,
    CoreModule.forRoot(),
    TimeagoModule.forRoot(),
    SocketIoModule,
    LoggerModule.forRoot({
      serverLoggingUrl: '/api/logs',
      level: NgxLoggerLevel.DEBUG,
      serverLogLevel: NgxLoggerLevel.ERROR
    }),
    SharedModule,
    PagesRoutingModule,
    NgxSpinnerModule,
    NgxAgoraModule.forRoot({ AppID: environment.AgoraAPPId }),
    ToastrModule.forRoot({
      preventDuplicates: true
    }),
    EffectsModule.forRoot([]),
    PaginationModule.forRoot(),
    TypeaheadModule.forRoot(),
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    TooltipModule.forRoot(),
    CookieModule.forRoot(),
    NgSlimScrollModule,
    NgxSkeletonLoaderModule,

    StoreModule.forRoot(reducers, {
      metaReducers: [clearState],
      runtimeChecks: {}
    }),

    StoreModule.forFeature('myRoundtables', myRoundtablesReducer),
    EffectsModule.forFeature([RoundTableEffects]),

    StoreModule.forFeature('roundtables', roundtablesreducer),
    EffectsModule.forFeature([RoundtablesEffects]),

    !environment.production ? StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }) : [],
    HammerModule,
    DialogsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireDatabaseModule
  ],
  providers: [
    ...appServices.services,
    ...authServices.services,
    RouteResolver,
    //ChatSocket,
    NotificationSocket,
    RolesGuard,
    {
      provide: SLIMSCROLL_DEFAULTS,
      useValue: {
        alwaysVisible: false,
        gridOpacity: '0.2',
        barOpacity: '0.5',
        gridBackground: '#c2c2c2',
        gridWidth: '6',
        gridMargin: '2px 2px',
        barBackground: '#2C3E50',
        barWidth: '6',
        barMargin: '2px 2px'
      } as ISlimScrollOptions
    },
    // {
    //   provide: ErrorHandler,
    //   useValue: Sentry.createErrorHandler({
    //     showDialog: true,
    //   }),
    // },
    // {
    //   provide: Sentry.TraceService,
    //   deps: [Router],
    // },
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: () => () => { },
    //   deps: [Sentry.TraceService],
    //   multi: true,
    // },
    {
      provide: OverlayContainer,
      useClass: FullscreenOverlayContainer
    },
    Meta
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
  constructor(private injector: Injector) {
    ServiceLocator.injector = injector;
  }
}


