// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();


export class Constants {
  static appPort = 3001;

  static t2tCoreUrl = process.env.BACKEND_CORE_URL || 'http://localhost:3000/api/v2/';

  static mongoDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
  static dbName = process.env.DB_NAME || 'timer2ticketDB';


  static isCommercialVersion: boolean = (process.env.IS_COMMERCIAL_VERSION === 'true');

  static emailHost = process.env.EMAIL_HOST || '';
  static emailUsername = process.env.EMAIL_USERNAME || '';
  static emailSecret = process.env.EMAIL_SECRET || '';

  static authAudience = process.env.AUTH0_AUDIENCE;
  static authDomain = process.env.AUTH0_DOMAIN;
  static authManagementDomain = process.env.AUTH0_MANAGEMENT_DOMAIN;
  static authManagementClientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  static authManagementClientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;
}