// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
import { auth } from 'express-oauth2-jwt-bearer';
import { Constants } from '../shared/constants';
import superagent from 'superagent';

export class Auth0Commons {
  private static _instance: Auth0Commons;

  public static get Instance(): Auth0Commons {
    return this._instance || (this._instance = new this());
  }

  checkJwt = auth({
    audience: Constants.authAudience,
    issuerBaseURL: Constants.authDomain,
  });

  // async function

  async getAuth0UserInfoFromToken(auth0Jwt: string): Promise<JSON> {
    const response = await superagent
      .post(`${Constants.authDomain}userinfo`)
      .auth(auth0Jwt, { type: 'bearer' })
      .send();

    return response.body;
  }

  getPayloadInfoFromToken(token: string): Record<string, never> | null{
    try {
      const payload = token.split('.')[1];
      const payloadDecoded = Buffer.from(payload, 'base64').toString('utf8');
      return JSON.parse(payloadDecoded);
    } catch (e) {
      return null;
    }
  }
}

export const auth0Commons = Auth0Commons.Instance;