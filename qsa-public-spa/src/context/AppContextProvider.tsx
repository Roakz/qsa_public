import React, { useState, useEffect } from 'react';
import { Http } from '../utils/http';
import AppContext, {IAppContext} from './AppContext';

class SessionCookie {
  static loadSessionFromCookie(cookieName: string): string | null {
    for (const cookie of document.cookie.split(';')) {
      if (cookie.trim().startsWith(`${cookieName}=`)) {
        return cookie.trim().split('=')[1];
      }
    }

    return null;
  }

  static clearSessionCookie(cookieName: string): void {
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  static setCookie(name: string, value: string): void {
    const isSecure = window.location.protocol === 'https:' ? ';secure' : '';
    document.cookie = `${name}=${value};samesite=Lax${isSecure};path=/`;
  }
}

const SESSION_COOKIE_NAME = 'archives_search_session';
const MASTER_SESSION_COOKIE_NAME = 'archives_search_master_session';

const AppContextProvider: React.FC<any> = (props: any) => {
  const existingSession = SessionCookie.loadSessionFromCookie(SESSION_COOKIE_NAME);
  const masterSession = SessionCookie.loadSessionFromCookie(MASTER_SESSION_COOKIE_NAME);

  const [appContext, setAppContext]: [any, any] = useState({
    sessionLoaded: !existingSession,
    cart: null,
    user: null,
    sessionId: existingSession,
    masterSessionId: masterSession,
    captchaVerified: null,
    showLoggedOutMessage: false,

    /* Update the currently logged in user */
    setUser: (user: any) => {
      setAppContext((oldState: IAppContext) => Object.assign({}, oldState, { user: user }));
    },

    setCaptchaVerified: (verified: boolean) => {
      setAppContext((oldState: IAppContext) => Object.assign({}, oldState, { captchaVerified: verified }));
    },

    setMasterSessionId: (sessionId: string) => {
      SessionCookie.setCookie(MASTER_SESSION_COOKIE_NAME, sessionId);
      setAppContext((oldState: IAppContext) => Object.assign({}, oldState, { masterSessionId: sessionId }));
    },

    /* Record the current user session token */
    setSessionId: (sessionId: string) => {
      SessionCookie.setCookie(SESSION_COOKIE_NAME, sessionId);

      Http.login(sessionId);

      setAppContext((oldState: IAppContext) => {
        return Object.assign({}, oldState, {
          sessionId: sessionId,
          showLoggedOutMessage: false,
        });
      });
    },

    /* Mark the session loading process as complete or not */
    setSessionLoaded: (value: boolean) => {
      setAppContext((oldState: IAppContext) => {
        return Object.assign({}, oldState, { sessionLoaded: value });
      });
    },

    setShowLoggedOutMessage: (value: boolean) => {
      if (value) {
        setAppContext((oldState: IAppContext) => Object.assign({}, oldState,
                                                               {
                                                                 showLoggedOutMessage: true,
                                                                 sessionId: null,
                                                                 sessionLoaded: true,
                                                                 user: null,
                                                                 cart: null,
                                                                 masterSessionId: null,
                                                                 captchaVerified: null,
                                                               }));
      } else {
        setAppContext((oldState: IAppContext) => Object.assign({}, oldState,
                                                               {
                                                                 showLoggedOutMessage: false,
                                                               }));
      }
    },

    refreshCart: (): Promise<any> => {
      return new Promise((resolve, reject) => {
        Http.get()
            .getCart()
            .then(
              (data: any) => {
                setAppContext((oldState: IAppContext) => Object.assign({}, oldState, { cart: data }));
                resolve();
              },
              () => {
                reject();
              }
            )
      });
    },

    /* Log out the current user */
    clearSession: (showLogout?: boolean) => {
      Http.logout();
      SessionCookie.clearSessionCookie(SESSION_COOKIE_NAME);
      SessionCookie.clearSessionCookie(MASTER_SESSION_COOKIE_NAME);

      setAppContext((oldState: IAppContext) => {
        return Object.assign({}, oldState, {
          sessionId: null,
          sessionLoaded: true,
          user: null,
          cart: null,
          masterSessionId: null,
          captchaVerified: null,
        });
      });
    }
  });


  /* If a child component sets a new session ID, fetch the current user */

  useEffect(() => {
    if (appContext.sessionId) {
      Http.login(appContext.sessionId);

      Http.get()
        .getCurrentUser()
        .then(
          (response: any) => {
            appContext.setUser(response.data);
            appContext.setSessionLoaded(true);
            appContext.setCaptchaVerified(true);
            appContext.refreshCart();
          },
          () => {
            appContext.clearSession();
          }
        );
    } else {
      appContext.clearSession();
      Http.get().isCaptchaVerified().then((json: any) => {
        appContext.setCaptchaVerified(json.status === 'verified');
      })
    }
  },
  // Adding appContext to the deps array here (as suggested by jslint) creates a loop.
  //
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  [appContext.sessionId]);

  if (appContext.sessionLoaded) {
    return <AppContext.Provider value={appContext}>{props.children}</AppContext.Provider>;
  } else {
    return <></>;
  }
};

export default AppContextProvider;
