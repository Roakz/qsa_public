import React from 'react';
import { UserForm } from '../models/User';

export interface IAppContext {
  sessionLoaded: boolean;
  cart: any;
  user: UserForm | null;
  sessionId: string | null;
  masterSessionId: string | null;
  captchaVerified: boolean | null,
  setUser: (user: any) => void;
  setCaptchaVerified: (verified: boolean) => void;
  setMasterSessionId: (sessionId: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setSessionLoaded: (value: boolean) => void;
  setShowLoggedOutMessage: (value: boolean) => void;
  refreshCart: () => Promise<any>;
  clearSession: (showLogout?: boolean) => void;
}

// Initialise with a never-used default value here to keep the type checker
// happy.  In real life, the AppContextProvider will provide the value.
const AppContext: React.Context<IAppContext> = React.createContext(
  {
    sessionLoaded: false,
    cart: null,
    user: null,
    sessionId: null,
    masterSessionId: null,
    captchaVerified: null,
    setUser: (user: any) => {},
    setCaptchaVerified: () => {},
    setMasterSessionId: () => {},
    setSessionId: () => {},
    setSessionLoaded: () => {},
    setShowLoggedOutMessage: (value: boolean) => {},
    refreshCart: (): Promise<any> => {
      return new Promise(() => {});
    },
    clearSession: (showLogout?: boolean) => {}
  } as IAppContext);

export const ClientState: any = {
  nonce: '' + Math.random(),
}

ClientState.refreshNonce = () => {
  ClientState.nonce = '' + Math.random();
}

export default AppContext;
