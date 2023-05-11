import express from 'express';
import { ConnectionFromClient } from '../models/connection/from_client/connection_from_client';
import { validate } from 'class-validator';
import { Connection } from '../models/connection/connection';
import { databaseService } from '../shared/database_service';
import { User } from '../models/user/user';
import { authCommons } from '../shared/auth_commons';
import { ObjectId } from 'mongodb';
import { SyncJobDefinitionFromClient } from '../models/connection/from_client/sync_job_definition_from_client';

const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Connections router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');

  next();
});

/**
 * Create new connection for user with auth0UserId in parameter.
 */
router.post('/', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;

  const connectionFromClient: ConnectionFromClient = new ConnectionFromClient(req.body);
  if (!connectionFromClient) {
    return res.status(400).send('Incorrect request body');
  }

  // validate connection from client object
  const validationResults = await validate(connectionFromClient);

  if (validationResults.length > 0) {
    return res.status(400).send('Incorrect request body: ' + JSON.stringify(validationResults));
  }

  const errors: string[] = [];
  const validateConnection = await connectionFromClient.validateConnectionTools(errors);

  if (!validateConnection) {
    return res.status(400).send('Incorrect request body: ' + JSON.stringify(errors));
  }

  // get next connection id
  const jwtToken = req.header('authorization');
  if (!jwtToken) {
    return res.status(400).send('Error getting user');
  }

  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  const nextId: number | null = await getUserNextId(auth0UserId);
  if (!nextId) {
    return res.status(400).send('Error getting user');
  }

  const connection: Connection = new Connection(user._id, nextId, connectionFromClient);

  const result = await databaseService.createConnection(connection);

  if (!result) {
    return res.status(400).send('Error creating connection');
  }

  return res.status(201).send(result);
});

/**
 * Returns user's connections.
 */
router.get('/', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;

  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  const connections: Connection[] = await databaseService.getActiveConnectionsByUserId(user._id);
  if (!connections) {
    return res.status(400).send('Error getting connections');
  }

  return res.status(200).send(connections);
});

/**
 * Returns user's connection with connectionId.
 */
router.get('/:connectionId', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const connectionId = req.params.connectionId;

  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  let objectId;
  try {
    objectId = new ObjectId(connectionId);
  } catch (error) {
    return res.status(400).send('Error getting connection');
  }

  const connection: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  return res.status(200).send(connection);
});

/**
 * Updates user's connection with connectionId.
 */
router.put('/:connectionId', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const connectionId = req.params.connectionId;

  // validate connection
  const connectionFromClient: ConnectionFromClient = new ConnectionFromClient(req.body);
  if (!connectionFromClient) {
    return res.status(400).send('Incorrect request body');
  }

  // validate connection from client object
  const validationResults = await validate(connectionFromClient);

  if (validationResults.length > 0) {
    return res.status(400).send('Incorrect request body: ' + JSON.stringify(validationResults));
  }

  const errors: string[] = [];
  const validateConnection = await connectionFromClient.validateConnectionTools(errors);

  if (!validateConnection) {
    return res.status(400).send('Incorrect request body: ' + JSON.stringify(errors));
  }

  // get current user
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  let objectId;
  try {
    objectId = new ObjectId(connectionId);
  } catch (error) {
    return res.status(400).send('Error getting connection');
  }

  // get current connection
  const connection: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  // update connection
  const newConnection: Connection = new Connection(connection.userId, connection.userConnectionId, connectionFromClient);

  // save connection
  const result = await databaseService.updateConnectionById(connection._id, newConnection);
  if (!result) {
    return res.status(400).send('Error updating connection');
  }

  result._id = connection._id;

  return res.status(200).send(result);
});

/**
 * Update connection activity defined by connectionId
 * Enabled only for isActive, configSyncJobDefinition and timeEntrySyncJobDefinition
 *
 */
router.patch('/:connectionId', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const connectionId = req.params.connectionId;

  // get current user
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  let objectId;
  try {
    objectId = new ObjectId(connectionId);
  } catch (error) {
    return res.status(400).send('Error getting connection');
  }

  // get current connection
  const connection: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  // update connection
  // update connection activity
  if ('isActive' in req.body) {
    if (typeof req.body.isActive !== 'boolean') {
      return res.status(400).send('Incorrect request body: isActive must be boolean');
    }
    connection.isActive = req.body.isActive;
  }

  // update connection configSyncJobDefinition
  if ('configSyncJobDefiniton' in req.body) {
    const configSyncJobDefinitionFromClient: SyncJobDefinitionFromClient = new SyncJobDefinitionFromClient(req.body.configSyncJobDefiniton);
    const validationResults = await validate(configSyncJobDefinitionFromClient);
    if (validationResults.length > 0) {
      return res.status(400).send('Incorrect request body: ' + JSON.stringify(validationResults));
    }

    connection.configSyncJobDefinition.schedule = configSyncJobDefinitionFromClient.getCronString();
    connection.configSyncJobDefinition.everyHour = configSyncJobDefinitionFromClient.everyHour;
    connection.configSyncJobDefinition.selectionOfDays = configSyncJobDefinitionFromClient.selectionOfDays;
    connection.configSyncJobDefinition.syncTime = configSyncJobDefinitionFromClient.syncTime;
  }

  // update connection configSyncJobDefinition
  if ('timeEntrySyncJobDefinition' in req.body) {
    const timeEntrySyncJobDefinitionFromClient: SyncJobDefinitionFromClient = new SyncJobDefinitionFromClient(req.body.timeEntrySyncJobDefinition);
    const validationResults = await validate(timeEntrySyncJobDefinitionFromClient);
    if (validationResults.length > 0) {
      return res.status(400).send('Incorrect request body: ' + JSON.stringify(validationResults));
    }

    connection.timeEntrySyncJobDefinition.schedule = timeEntrySyncJobDefinitionFromClient.getCronString();
    connection.timeEntrySyncJobDefinition.everyHour = timeEntrySyncJobDefinitionFromClient.everyHour;
    connection.timeEntrySyncJobDefinition.selectionOfDays = timeEntrySyncJobDefinitionFromClient.selectionOfDays;
    connection.timeEntrySyncJobDefinition.syncTime = timeEntrySyncJobDefinitionFromClient.syncTime;
  }

  const result = await databaseService.updateConnectionById(connection._id, connection);

  if (!result) {
    return res.status(400).send('Error updating connection');
  }

  result._id = connection._id;

  return res.status(200).send(result);
});

/**
 * Delete connection defined by connectionId
 * Connection is not deleted from database, but only marked as deleted
 */
router.delete('/:connectionId', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const connectionId = req.params.connectionId;

  // get current user
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  let objectId;
  try {
    objectId = new ObjectId(connectionId);
  } catch (error) {
    return res.status(400).send('Error getting connection');
  }

  // get current connection
  const connection: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  // mark to delete
  connection.deleteTimestamp = Math.floor(Date.now() / 1000);
  const result = await databaseService.updateConnectionById(connection._id, connection);
  if (!result) {
    return res.status(400).send('Error deleting connection');
  }

  return res.sendStatus(200);
});

/**
 * Restore connection marked to delete defined by connectionId
 * If connection is not marked to delete, 400 is returned
 */
router.post('/:connectionId/restore', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const connectionId = req.params.connectionId;

  // get current user
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  let objectId;
  try {
    objectId = new ObjectId(connectionId);
  } catch (error) {
    return res.status(400).send('Error getting connection');
  }

  // get current connection
  const connection: Connection | null = await databaseService.getConnectionById(objectId);
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  // unmark to delete
  connection.deleteTimestamp = null;
  const result = await databaseService.updateConnectionById(connection._id, connection);
  if (!result) {
    return res.status(400).send('Error deleting connection');
  }

  return res.sendStatus(200);
});

/**
 * Immidiate syncs config objects
 */
router.post('/:connectionId/syncConfigObjects', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const connectionId = req.params.connectionId;

  // get current user
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  let objectId;
  try {
    objectId = new ObjectId(connectionId);
  } catch (error) {
    return res.status(400).send('Error getting connection');
  }

  // get current connection
  const connection: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.isActive) {
    return res.status(400).send('Connection is not active');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  if (connection.configSyncJobDefinition.status === 'IN_PROGRESS') {
    return res.status(400).send('Synchronization of config objects is in progress. Please wait until it is finished.');
  }

  // TODO mocked for test purposes

  connection.configSyncJobDefinition.status = 'IN_PROGRESS';
  await databaseService.updateConnectionById(connection._id, connection);

  res.sendStatus(200);
  // sleep for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('syncing config objects finished')
  const connectionTmp: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if(!connectionTmp) {
    return;
  }
  connectionTmp.configSyncJobDefinition.status = 'SUCCESS';
  connectionTmp.configSyncJobDefinition.lastJobTime = Math.floor(Date.now() / 1000);
  await databaseService.updateConnectionById(connectionTmp._id, connectionTmp);
});

/**
 * Immidiate syncs time entries
 */
router.post('/:connectionId/syncTimeEntries', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const connectionId = req.params.connectionId;

  // get current user
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(400).send('Error getting user');
  }

  let objectId;
  try {
    objectId = new ObjectId(connectionId);
  } catch (error) {
    return res.status(400).send('Error getting connection');
  }

  // get current connection
  const connection: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.isActive) {
    return res.status(400).send('Connection is not active');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }


  if (connection.timeEntrySyncJobDefinition.status === 'IN_PROGRESS') {
    return res.status(400).send('Synchronization of config objects is in progress. Please wait until it is finished.');
  }
  // TODO mocked for test purposes

  connection.timeEntrySyncJobDefinition.status = 'IN_PROGRESS';
  await databaseService.updateConnectionById(connection._id, connection);

  res.sendStatus(200);

  // sleep for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('syncTimeEntries finished')
  const connectionTmp: Connection | null = await databaseService.getActiveConnectionById(objectId);
  if(!connectionTmp) {
    return;
  }
  connectionTmp.timeEntrySyncJobDefinition.status = 'SUCCESS';
  connectionTmp.timeEntrySyncJobDefinition.lastJobTime = Math.floor(Date.now() / 1000);
  await databaseService.updateConnectionById(connectionTmp._id, connectionTmp);
});


/**
 * Returns user from database with auth0UserId in parameter.
 * @param auth0UserId Auth0 user id
 */
async function getUserFromDatabase(auth0UserId: string): Promise<User | null> {
  const user = await databaseService.getUserByAuth0UserId(auth0UserId);
  if (!user) {
    return null;
  }
  return user;
}

/**
 * Returns next connection id for user with auth0UserId in parameter.
 * @param auth0UserId Auth0 user id
 */
async function getUserNextId(auth0UserId: string): Promise<number | null> {
  return await databaseService.getNextConnectionId(auth0UserId);
}

module.exports = router;