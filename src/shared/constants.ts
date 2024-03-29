export class Constants {
  static appPort = 3001;

  static t2tCoreUrl = process.env.BACKEND_CORE_URL || 'http://localhost:3000/api/';

  static sentryDsn = process.env.SENTRY_DSN || '';

  static mongoDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';

  static jwtSecret = process.env.JWT_SECRET || '';

  static emailHost = process.env.EMAIL_HOST || '';
  static emailUsername = process.env.EMAIL_USERNAME || '';
  static emailSecret = process.env.EMAIL_SECRET || '';

  static bcryptSaltRounds = 10;
}