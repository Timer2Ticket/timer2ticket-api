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

  const connections: Connection[] = await databaseService.getConnectionsByUserId(user._id);
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

  const connection: Connection | null = await databaseService.getConnectionById(new ObjectId(connectionId));
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

  // get current connection
  const connection: Connection | null = await databaseService.getConnectionById(new ObjectId(connectionId));
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

  // get current connection
  const connection: Connection | null = await databaseService.getConnectionById(new ObjectId(connectionId));
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  // update connection
  // update connection activity
  if("isActive" in req.body) {
    if(typeof req.body.isActive !== 'boolean') {
      return res.status(400).send('Incorrect request body: isActive must be boolean');
    }
    connection.isActive = req.body.isActive;
  }

  // update connection configSyncJobDefinition
  if("configSyncJobDefiniton" in req.body) {
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
  if("timeEntrySyncJobDefinition" in req.body) {
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

  // get current connection
  const connection: Connection | null = await databaseService.getConnectionById(new ObjectId(connectionId));
  if (!connection) {
    return res.status(400).send('Error getting connection');
  }

  if (!connection.userId.equals(user._id)) {
    return res.status(400).send('Error getting connection');
  }

  // delete connection
  const result = await databaseService.deleteConnectionById(connection._id);
  if (!result) {
    return res.status(400).send('Error deleting connection');
  }

  return res.sendStatus(200);
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