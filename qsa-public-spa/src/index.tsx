import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import './index.scss';
import { BrowserRouter, Switch, Route, RouteComponentProps } from 'react-router-dom';
import AppContext, {IAppContext} from './context/AppContext';

import axios from 'axios';

import './scss/qsa-public.scss';

import '../node_modules/quill/dist/quill.snow.css';

import HomePage from './recordViews/Home';
import AgencyPage from './recordViews/Agency';
import GenericErrorPage from './recordViews/GenericErrorPage';
import NotFound from './recordViews/NotFound';
import ResultsPage from './recordViews/Results';
import SeriesPage from './recordViews/Series';
import FunctionPage from './recordViews/Function';
import MandatePage from './recordViews/Mandate';
import ItemPage from './recordViews/Item';
import {LoginPage, LogoutPage} from './recordViews/UserSession';
import PageViewPage from './recordViews/PageViewPage';

import AppContextProvider from './context/AppContextProvider';
import {
  BannedTagsManagementPage,
  ChangePasswordPage,
  MyAccountPage,
  MyContactDetailsPage,
  MyRequestsPage,
  RegisterPage, TagManagementPage,
  UserManagementPage,
  PageManagementPage, MySearchesPage, MyRequestPage,
} from './recordViews/Users';
import { PasswordRecoveryPage } from './recordViews/PasswordRecovery';

import { MyReadingRoomRequestsCartPage } from './cart/MyReadingRoomRequestsCartPage';
import { DigitalCopyCartSummaryPage } from './cart/DigitalCopyCartSummaryPage';
import { DigitalCopyRequestQuotePage } from './cart/DigitalCopyRequestQuotePage';
import { DigitalCopySetPricePage } from "./cart/DigitalCopySetPricePage";
import { DigitalCopyMinicartPage } from "./cart/DigitalCopyMinicartPage";

import ErrorPage from "./context/ErrorPage";

import ReactGA from 'react-ga';
import {RecordDisplay} from "./models/RecordDisplay";

declare var AppConfig: any;

if (AppConfig.google_analytics_tracking_id) {
  ReactGA.initialize(AppConfig.google_analytics_tracking_id);
}

/* Establish error handling */
class ErrorBuffer {
  static FLUSH_DELAY_MS = 2000;

  private errors: ErrorEvent[];
  private consoleMessages: { method: string; arguments: any[] }[];
  private flushing: boolean;

  constructor() {
    this.errors = [];
    this.consoleMessages = [];
    this.flushing = false;

    this.startTimer();
  }

  private startTimer() {
    setInterval(() => {
      this.flush();
    }, ErrorBuffer.FLUSH_DELAY_MS);
  }

  private flush() {
    if (this.flushing || (this.errors.length === 0 && this.consoleMessages.length === 0)) {
      return;
    }

    const errors = this.errors;
    const consoleMessages = this.consoleMessages;

    this.errors = [];
    this.consoleMessages = [];

    this.flushing = true;
    axios
      .post(`${process.env.REACT_APP_QSA_PUBLIC_URL}/api/error_report`, {
        errors: this.formatErrors(errors),
        consoleMessages: this.formatMessages(consoleMessages)
      })
      .finally(() => {
        this.flushing = false;
      });
  }

  private formatErrors(errors: ErrorEvent[]): any[] {
    return errors.map((error: ErrorEvent) => {
      return {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        stack: (error.error && error.error.stack) ? error.error.stack : [],
      };
    });
  }

  private formatMessages(messages: any[]): any[] {
    return messages;
  }

  addError(error: ErrorEvent) {
    this.errors.push(error);
  }

  addConsoleMessage(msg: any) {
    this.consoleMessages.push(msg);
  }
}

const appErrorBuffer = new ErrorBuffer();

/* Hook console to capture messages */
const browserConsole: any = console;
const appConsole: any = {};

Object.keys(browserConsole).forEach(function(key) {
  appConsole[key] = function(...rest: any[]) {
    appErrorBuffer.addConsoleMessage({
      method: key,
      arguments: rest
    });
    browserConsole[key].apply(this, arguments);
  };
});

// eslint-disable-next-line no-native-reassign
console = appConsole;

/* Grab errors that hit the top-level */
window.addEventListener('error', function(event) {
  appErrorBuffer.addError(event);

  return false;
});

let routeKey = 0;

function wrappedRoute(component: any, opts: { alwaysRender?: boolean; pageTitle?: string; deferTriggerPageView?: boolean } = {}): any {
  if (typeof opts.alwaysRender === 'undefined') {
    opts.alwaysRender = true;
  }

  return (props: RouteComponentProps<any>) => {
    if (opts.alwaysRender) {
      window.scrollTo(0, 0);
    }

    // Clear noindex that might have been added by the layout during a 404
    document.head.querySelectorAll('meta[name="robots"][content="noindex"]').forEach(meta => {
      meta && meta.parentNode && meta.parentNode.removeChild(meta);
    });

    const setPageTitle = (s: string) => {
      const title = document.head.querySelector('title');
      if (title) {
        title.innerText = s;
      }
    };

    const triggerPageViewTracker = (path?: string) => {
      if (AppConfig.google_analytics_tracking_id) {
        if (path) {
          ReactGA.pageview(path);
        } else {
          ReactGA.pageview(window.location.pathname + window.location.search);
        }
      }
    };

    const triggerDownloadTracker = (path: any, representation: RecordDisplay): void => {
      if (AppConfig.google_analytics_tracking_id) {
        ReactGA.pageview(path, [], 'Download: ' + representation.get('qsa_id_prefixed') + ' ' + representation.get('title'));
      }
    };

    if (opts.pageTitle) {
      setPageTitle(opts.pageTitle);
    }

    if (!opts.deferTriggerPageView) {
      triggerPageViewTracker();
    }

    routeKey++;
    return (<ErrorPage>
      <AppContext.Consumer>
        {
          (context: IAppContext) => {
            return React.createElement(
              component,
              Object.assign({},
                            props,
                            {
                              routeKey,
                              setPageTitle,
                              context,
                              triggerPageViewTracker,
                              triggerDownloadTracker,
                            },
                            opts.alwaysRender ? { key: routeKey } : {}));
          }
        }
      </AppContext.Consumer>
    </ErrorPage>);
  };
}

ReactDOM.render(
  <AppContextProvider>
    <BrowserRouter>
      <Switch>
        <Route
          exact
          path="/"
          component={wrappedRoute(HomePage, {
            pageTitle: 'ArchivesSearch: Home'
          })}
        />
        <Route path="/agencies/:qsaId" component={wrappedRoute(AgencyPage, { pageTitle: 'View agency', deferTriggerPageView: true })} />
        <Route path="/series/:qsaId" component={wrappedRoute(SeriesPage, { pageTitle: 'View series', deferTriggerPageView: true })} />
        <Route path="/functions/:qsaId" component={wrappedRoute(FunctionPage, { pageTitle: 'View function', deferTriggerPageView: true })} />
        <Route path="/mandates/:qsaId" component={wrappedRoute(MandatePage, { pageTitle: 'View mandate', deferTriggerPageView: true })} />
        <Route path="/items/:qsaId" component={wrappedRoute(ItemPage, { pageTitle: 'View item', deferTriggerPageView: true })} />
        <Route exact path="/login" component={wrappedRoute(LoginPage, { pageTitle: 'Login' })} />
        <Route exact path="/search" component={wrappedRoute(ResultsPage, { pageTitle: 'Search records' })} />
        <Route exact path="/register" component={wrappedRoute(RegisterPage, { pageTitle: 'Register' })} />
        <Route
          exact
          path="/recover-password/:token?"
          component={wrappedRoute(PasswordRecoveryPage, { pageTitle: 'Password Recovery' })}
        />
        <Route exact path="/my-account" component={wrappedRoute(MyAccountPage, { pageTitle: 'My Account' })} />
        <Route exact path="/reading-room-requests-cart" component={wrappedRoute(MyReadingRoomRequestsCartPage, { pageTitle: 'Pending Reading Room Requests' })} />
        <Route exact path="/digital-copies-cart" component={wrappedRoute(DigitalCopyCartSummaryPage, { pageTitle: 'Pending Digital Copy Requests' })} />
        <Route exact path="/digital-copies-cart/request-quote" component={wrappedRoute(DigitalCopyRequestQuotePage, { pageTitle: 'Request Quote for Digital Copies' })} />
        <Route exact path="/digital-copies-cart/set-price-checkout" component={wrappedRoute(DigitalCopySetPricePage, { pageTitle: 'Checkout Set Price Digital Copies' })} />
        <Route exact path="/digital-copies-cart/minicart" component={wrappedRoute(DigitalCopyMinicartPage, { pageTitle: 'Confirm Your Order' })} />
        <Route exact path="/my-requests" component={wrappedRoute(MyRequestsPage, { pageTitle: 'My Requests' })} />
        <Route exact path="/my-requests/:id" component={wrappedRoute(MyRequestPage, { pageTitle: 'My Request' })} />
        <Route
          exact
          path="/my-details"
          component={wrappedRoute(MyContactDetailsPage, {
            pageTitle: 'My Contact Details'
          })}
        />
        <Route
          exact
          path="/change-password"
          component={wrappedRoute(ChangePasswordPage, {
            pageTitle: 'Change Password'
          })}
        />
        <Route
          exact
          path="/admin/users"
          component={wrappedRoute(UserManagementPage, {
            pageTitle: 'User Management'
          })}
        />
        <Route
          exact
          path="/admin/users/:user_id"
          component={wrappedRoute(UserManagementPage, {
            pageTitle: 'User Management'
          })}
        />
        <Route
          exact
          path="/logout"
          component={wrappedRoute(LogoutPage, {
            pageTitle: 'Logged Out'
          })}
        />
        <Route
            exact
            path="/admin/tags"
            component={wrappedRoute(TagManagementPage, {
              pageTitle: 'Tag Management'
            })}
        />
        <Route
            exact
            path="/admin/banned-tags"
            component={wrappedRoute(BannedTagsManagementPage, {
              pageTitle: 'Banned Tag Management'
            })}
        />
        <Route
            exact
            path="/admin/pages"
            component={wrappedRoute(PageManagementPage, {
              pageTitle: 'Page Management'
            })}
        />
        <Route
            exact
            path="/admin/pages/:slug"
            component={wrappedRoute(PageManagementPage, {
              pageTitle: 'Edit Page'
            })}
        />
        <Route
            exact
            path="/my-searches"
            component={wrappedRoute(MySearchesPage, {
              pageTitle: 'My Searches'
            })}
        />
        <Route
            exact
            path="/pages/:slug"
            component={wrappedRoute(PageViewPage, {
              pageTitle: 'View Page',
              deferTriggerPageView: true,
            })}
        />
        <Route
          exact
          path="/error"
          component={wrappedRoute(GenericErrorPage, { pageTitle: 'System error' })}
        />

        <Route component={wrappedRoute(NotFound, { pageTitle: 'Page not found' })} />
      </Switch>
    </BrowserRouter>
  </AppContextProvider>,

  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
