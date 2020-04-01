import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { Http } from '../utils/http';
import { CartSummary } from '../cart/CartSummary';

import { IAppContext } from '../context/AppContext';
import { PageRoute } from '../models/PageRoute';


export const UserSession: React.FC<any> = (props: any) => {
  const context = props.context;

  const displayName = (user: any) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`;
    } else {
      return user.email;
    }
  };

  return (
   <>
      {context.showLoggedOutMessage && (
        <div className="alert alert-warning" role="alert" style={{ marginTop: 5, marginBottom: 5, padding: '0 10px' }}>
          <p>Your session expired due to inactivity.  Please log in again.</p>
        </div>
      )}

      {context.sessionLoaded && (
        <div className="login-box pull-right">
          <CartSummary cart={context.cart} />
          {context.user ? (
            <small>
              Hello, {displayName(context.user)}
              &nbsp;|&nbsp;
              <Link to="/logout">
                {
                  context.masterSessionId ? "Return to admin" : "Log Out"
                }
              </Link>
            </small>
          ) : (
            <small>
              <Link to="/login">Log In</Link>
            </small>
          )}
        </div>
      )}
    </>
  );
};


export const LoginPage: React.FC<PageRoute> = (route: PageRoute) => {
  const context = route.context;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginFailed, setShowLoginFailed] = useState(false);
  const [loginFailedMessage, setLoginFailedMessage] = useState('');
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [rateLimitDelay, setRateLimitDelay] = useState(0);

  const onSubmit = (appContext: any) => {
    setShowLoginFailed(false);
    Http.get()
      .login(email, password)
      .then((login_response: any) => {
        if (login_response.authenticated) {
          appContext.setSessionId(login_response.session_id);
          setShowLoginSuccess(true);
        } else {
          appContext.setUser(null);
          setShowLoginFailed(true);
          setRateLimitDelay(login_response.delay_seconds);
          if (login_response.user_inactive) {
            setLoginFailedMessage('There is an issue with your account please contact info@archives.qld.gov.au');
          } else if (rateLimitDelay > 0) {
            setLoginFailedMessage('Please wait ' + rateLimitDelay + ' second(s) before trying again.');
          } else {
            setLoginFailedMessage('Invalid email or password.')
          }
        }
      });
  };

  if (showLoginSuccess) {
    return (
      <Layout noindex={true}>
        <div className="row">
          <div className="col-sm-12">
            <div className="alert alert-success" role="alert">
              <h2>
                <i className="fa fa-check-circle" />
                Login Success
              </h2>
              <p>
                Return to <Link to="/">ArchivesSearch</Link> or visit <Link to="/my-account">your account</Link>.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout noindex={true}>
      <div className="row">
        <div className="col-sm-12">
          <h1>Login</h1>
          <form
            method="GET"
            onSubmit={e => {
              e.preventDefault();
              onSubmit(context);
            }}
            className="form-inline"
          >
            <div className="qg-call-out-box">
              {showLoginFailed && (
                <div className="alert alert-warning" role="alert" style={{ marginBottom: 20 }}>
                  <p>{loginFailedMessage}</p>
                </div>
              )}
              <div className="form-row">
                <div className="form-group col-xs-12 col-sm-6">
                  <label htmlFor="email" className="sr-only">
                    Email Address
                  </label>
                  <input
                    type="text"
                    className="form-control-plaintext"
                    id="email"
                    placeholder="Email Address"
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group col-xs-12 col-sm-6">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control-plaintext"
                    id="password"
                    placeholder="Password"
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <p>
                <small>
                  New user? <Link to="/register">Create an account here</Link>
                </small>
                <br />
                <small>
                  <Link to="/recover-password">Recover password</Link>
                </small>
              </p>
            </div>

            <div className="form-row col-md-12">
              <p>
                <button type="submit" className="qg-btn btn-primary">
                  Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export const LogoutPage: React.FC<PageRoute> = (route: PageRoute) => {
  const context = route.context;

  const [logoutTriggered, setLogoutTriggered] = useState(false);

  const logout = (context: IAppContext) => {
    if (!logoutTriggered) {
      setLogoutTriggered(true);
      Http.get().logout();

      const masterSessionId = context.masterSessionId;

      context.clearSession();
      context.setSessionId(masterSessionId);
    }

    return true;
  };

  logout(context)

  return (
    <Layout noindex={true}>
      <div className="row">
        <div className="col-sm-12">
          {
            (context.user && context.user.is_admin) ?
              <div className="alert alert-success" role="alert">
                You are now logged in
                as <strong>{context.user.email}</strong> again.
              </div> :
              <div className="alert alert-success" role="alert">
                <h2><i className="fa fa-check-circle"/>Logout Success</h2>
                <p>Return to <Link to="/">ArchivesSearch</Link> or log in again <Link to="/login">here</Link>.</p>
              </div>
          }
        </div>
      </div>
    </Layout>
  );
}
