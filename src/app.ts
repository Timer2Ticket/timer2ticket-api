import express from 'express';
import { databaseService } from './shared/database_service';
import { translateService } from './shared/translate_service';
import { Constants } from './shared/constants';

/* eslint-disable @typescript-eslint/no-var-requires */

const usersRoutes = require('./routes/users');
const membershipRoutes = require('./routes/membership');
const connectionRoutes = require('./routes/connections');

const syncedServicesConfigRoutes = require('./routes/synced_services_config');

// const jobsRoutes = require('./routes/jobs');
// const jobLogsRoutes = require('./routes/job_logs');

const app = express();

if (Constants.isCommercialVersion) {
  const stripeRoutes = require('./routes/stripe');
  const stripePublicRoutes = require('./routes/stripe_public');

  app.use('/api/v2/users/:auth0UserId/stripe', stripeRoutes);
  app.use('/api/v2/stripe', stripePublicRoutes);
}

app.use('/api/v2/users/:auth0UserId/membership', membershipRoutes);
app.use('/api/v2/users/:auth0UserId/connections', connectionRoutes);

// Needs to be last, because it is catch all users route
app.use('/api/v2/users/:auth0UserId', usersRoutes);

app.use('/api/v2/synced_services_config', syncedServicesConfigRoutes);

// app.use('/api/v2/jobs', jobsRoutes);
// app.use('/api/v2/job_logs', jobLogsRoutes);

app.listen(Constants.appPort, async () => {
  await databaseService.init();
  await translateService.init();

  return console.log(`Server is listening on ${Constants.appPort}`);
});