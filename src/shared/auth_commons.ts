import { auth } from 'express-oauth2-jwt-bearer';
import { Constants } from './constants';

export class AuthCommons {
  private static _instance: AuthCommons;

  public static get Instance(): AuthCommons {
    return this._instance || (this._instance = new this());
  }

  // Authorization middleware. When used, the Access Token must
  // exist and be verified against the Auth0 JSON Web Key Set.
  checkJwt = auth({
    audience: Constants.authAudience,
    issuerBaseURL: Constants.authDomain,
  });


  // eslint-disable-next-line
  authorizeUser(req: any): boolean {
    const auth0UserId = req.params.auth0UserId;
    const authSub = req.auth.payload.sub;

    if (!auth0UserId || !authSub) {
      return false;
    }

    // check if user is authorized to get this user
    if (authSub !== auth0UserId) {
      return false;
    }

    return true;
  }
}

export const authCommons = AuthCommons.Instance;