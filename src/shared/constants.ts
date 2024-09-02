// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();


export class Constants {
  static appPort = 3001;

  static t2tCoreUrl = process.env.BACKEND_CORE_URL || 'http://localhost:3000/api/v2/';
  static sentryDsn = process.env.SENTRY_DSN || '';

  static mongoDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
  static dbName = process.env.DB_NAME || 'timer2ticketDB';

  static isCommercialVersion: boolean = Constants.getBooleanValue(process.env.IS_COMMERCIAL_VERSION);

  static emailHost = process.env.EMAIL_HOST || '';
  static emailUsername = process.env.EMAIL_USERNAME || '';
  static emailSecret = process.env.EMAIL_SECRET || '';

  static authAudience = process.env.AUTH0_AUDIENCE;
  static authDomain = process.env.AUTH0_DOMAIN;
  static authManagementDomain = process.env.AUTH0_MANAGEMENT_DOMAIN;
  static authManagementClientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  static authManagementClientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;

  static webhooksAntiCycleTimeout = 1000 * 60 //1 minute in milliseconds

  private static getBooleanValue(value: string | boolean | null | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value === 'true';
    }

    return false;
  }
}
