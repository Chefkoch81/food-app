import { forwardRef, Inject, Injectable } from '@angular/core';
import {
  MsalBroadcastService,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  EventMessage,
  EventType,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ConfigService } from '../../core/config/config.service';
import { MsalAuthState } from './auth.reducer';
import { Store } from '@ngrx/store';
import { loginSuccess, logout } from './auth.actions';
import { MsalAuthResponse } from '../auth.model';
import { getUser, isAuthenticated } from './auth.selectors';

@Injectable()
export class MsalAuthFacade {
  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(forwardRef(() => ConfigService)) private cs: ConfigService,
    private msalBC: MsalBroadcastService,
    private store: Store<MsalAuthState>
  ) {
    this.handleLoginSuccess(this.msalBC);
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  getAuthState() {
    return !environment.authEnabled;
  }

  getUser() {
    return this.store.select(getUser);
  }

  isInitAndAuthenticated() {
    return combineLatest(
      [this.store.select(isAuthenticated), this.cs.cfgInit],
      (isAuth: boolean, isInit: boolean) => isAuth && isInit
    );
  }

  // static getMSALInstance(): IPublicClientApplication {
  //   let config = {
  //     auth: {
  //       clientId: 'fb9e23e2-7727-40a3-9515-7f53d90c6cab',
  //       authority:
  //         'https://login.microsoftonline.com/d92b247e-90e0-4469-a129-6a32866c0d0a',
  //       redirectUri: 'http://localhost:4200/',
  //     },
  //     cache: {
  //       cacheLocation: BrowserCacheLocation.LocalStorage,
  //       storeAuthStateInCookie: isIE, // set to true for IE 11
  //     },
  //     system: {
  //       loggerOptions: {
  //         loggerCallback,
  //         logLevel: LogLevel.Info,
  //         piiLoggingEnabled: false,
  //       },
  //     },
  //   };
  //   return new PublicClientApplication(config);
  // }

  handleLoginSuccess = (broadcast: MsalBroadcastService) => {
    return broadcast.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        )
      )
      .subscribe((result: EventMessage) => {
        let resp: MsalAuthResponse = result.payload as MsalAuthResponse;
        this.store.dispatch(loginSuccess({ authResponse: resp }));
        console.log(`MSAL Event ${result.eventType}`, result.payload);
      });
  };

  logout() {
    this.store.dispatch(logout());
  }
}

//app module statics
export const isIE =
  window.navigator.userAgent.indexOf('MSIE ') > -1 ||
  window.navigator.userAgent.indexOf('Trident/') > -1;

export const loggerCallback = (logLevel: LogLevel, message: string) => {
  console.log(logLevel, message);
};

export function MSALInstanceFactory(): IPublicClientApplication {
  let config = {
    auth: {
      clientId: 'd23642f7-9ccf-4165-92e7-919f625a5acc',
      authority:
        'https://login.microsoftonline.com/d92b247e-90e0-4469-a129-6a32866c0d0a',
      redirectUri: '/',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false,
      },
    },
  };
  return new PublicClientApplication(config);
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  // protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', [
  //   'user.read',
  // ]);
  protectedResourceMap.set('https://localhost:5001/food', [
    'api://b509d389-361a-447b-afb2-97cc8131dad6/FoodApp.BasicUser',
  ]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [
        'offline_access',
        'openid',
        'profile',
        'api://b509d389-361a-447b-afb2-97cc8131dad6/access_as_user',
      ],
    },
  };
}
