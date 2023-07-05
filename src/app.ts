import express from 'express';
import { databaseService } from './shared/database_service';
import { Constants } from './shared/constants';
import { translateService } from './shared/translate_service';

/* eslint-disable @typescript-eslint/no-var-requires */

const usersRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');
const syncedServicesConfigRoutes = require('./routes/synced_services_config');
const jobLogsRoutes = require('./routes/job_logs');

const app = express();

if (Constants.isCommercialVersion) {
  const stripeRoutes = require('./routes/commercial/stripe');
  const stripePublicRoutes = require('./routes/commercial/stripe_webhook');
  const syncLogsRoutes = require('./routes/commercial/sync_logs');
  const membershipRoutes = require('./routes/commercial/membership');

  app.use('/api/v2/users/:auth0UserId/stripe', stripeRoutes);
  app.use('/api/v2/stripe', stripePublicRoutes);
  app.use('/api/v2/users/:auth0UserId/syncLogs', syncLogsRoutes);
  app.use('/api/v2/users/:auth0UserId/membership', membershipRoutes);
}

app.use('/api/v2/users/:auth0UserId/connections', connectionRoutes);
app.use('/api/v2/users/:auth0UserId/jobLogs', jobLogsRoutes);

// Needs to be last, because it is catch all users route
app.use('/api/v2/users/:auth0UserId', usersRoutes);

app.use('/api/v2/synced_services_config', syncedServicesConfigRoutes);

app.listen(Constants.appPort, async () => {
  await databaseService.init();
  await translateService.init();

  return console.log(`Server is listening on ${Constants.appPort}`);
});