import express from 'express';
import { databaseService } from './shared/database_service';
import { translateService } from './shared/translate_service';
import { Constants } from './shared/constants';

/* eslint-disable @typescript-eslint/no-var-requires */
const usersRoutes = require('./routes/users');
const jobsRoutes = require('./routes/jobs');
const syncedServicesConfigRoutes = require('./routes/synced_services_config');
const jobLogsRoutes = require('./routes/job_logs');

const app = express();

app.use('/api/v2/users', usersRoutes);
app.use('/api/v2/jobs', jobsRoutes);
app.use('/api/v2/synced_services_config', syncedServicesConfigRoutes);
app.use('/api/v2/job_logs', jobLogsRoutes);

app.listen(Constants.appPort, async () => {
  await databaseService.init();
  await translateService.init();

  return console.log(`Server is listening on ${Constants.appPort}`);
});