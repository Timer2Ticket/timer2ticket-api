import express from 'express';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import bcrypt from 'bcrypt';
import { databaseService } from '../shared/database_service';
import { UserToClient } from '../models/user_to_client';
import { UserFromClient } from '../models/user_from_client';
import { validate } from 'class-validator';
import { Constants } from '../shared/constants';
import { UserChangePassword } from '../models/user_change_password';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Time: ${Date.now()}`);

  // verify JWT

  const tokenFromHeader = req.headers["x-access-token"];

  if (!tokenFromHeader) {
    return res.sendStatus(403);
  }

  const token = Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : tokenFromHeader;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt.verify(token, Constants.jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.sendStatus(401);
    }
    res.locals.userIdFromToken = decoded.id;
    res.locals.token = token;
    next();
  });
});

/**
 * Get user with userId in parameter - needs to be 24 length string (MongoDB ObjectId)
 */
router.get('/:userId([a-zA-Z0-9]{24})', async (req, res) => {
  const userId = req.params.userId;
  const token = res.locals.token;

  // authorize if userId from JWT is the same as in userId param
  if (!res.locals.userIdFromToken || !userId || !token) {
    return res.sendStatus(400);
  }

  if (res.locals.userIdFromToken !== userId) {
    return res.sendStatus(401);
  }

  const user = await databaseService.getUserById(userId);

  if (!user) {
    return res.sendStatus(404);
  }

  return res.send(new UserToClient(user, token));
});

/**
 * Updates user taken from body.user
 */
router.put('/:userId([a-zA-Z0-9]{24})', async (req, res) => {
  const userId = req.params?.userId;
  const token = res.locals?.token;

  if (!res.locals.userIdFromToken || !userId || !token) {
    return res.sendStatus(400);
  }

  const userFromClient: UserFromClient = req.body?.user;

  if (!res.locals.userIdFromToken || !userId || !token || !userFromClient) {
    return res.sendStatus(400);
  }

  // authorize if userId from JWT is the same as in userId param
  if (res.locals.userIdFromToken !== userId) {
    return res.sendStatus(401);
  }

  // validate user from client object
  const validationResults = await validate(userFromClient);
  console.log(validationResults);

  // validate correct cron schedule format (is not validated above)
  let isScheduleValid = true;
  if (userFromClient.configSyncJobDefinition) {
    isScheduleValid &&= cron.validate(userFromClient.configSyncJobDefinition.schedule);
  }
  if (userFromClient.timeEntrySyncJobDefinition) {
    isScheduleValid &&= cron.validate(userFromClient.timeEntrySyncJobDefinition.schedule);
  }

  if (validationResults.length !== 0 || isScheduleValid === false) {
    return res.sendStatus(400);
  }

  const user = await databaseService.getUserById(userId);

  if (!user) {
    return res.sendStatus(404);
  }

  if (user.status === 'registrated') {
    // set to inactive after config confirm, client should send another api request to start syncing (and status => active)
    user.status = 'inactive';
  }

  // only these properties can be changed this way
  user.configSyncJobDefinition = userFromClient.configSyncJobDefinition;
  user.timeEntrySyncJobDefinition = userFromClient.timeEntrySyncJobDefinition;
  user.serviceDefinitions = userFromClient.serviceDefinitions;

  const updatedUser = await databaseService.updateUser(user);

  if (updatedUser) {
    return res.send(new UserToClient(updatedUser, token));
  } else {
    return res.sendStatus(503);
  }
});

/**
 * Changes user's password
 */
router.post('/change_password/:userId([a-zA-Z0-9]{24})', async (req, res) => {
  const userId = req.params?.userId;
  const token = res.locals?.token;

  if (!res.locals.userIdFromToken
    || !userId || !token
    || !req.body['oldPassword']
    || !req.body['newPassword']
    || !req.body['newPasswordAgain']) {
    return res.sendStatus(400);
  }

  const userChangePassword = new UserChangePassword(
    req.body['oldPassword'],
    req.body['newPassword'],
    req.body['newPasswordAgain'],
  );

  if (!userChangePassword) {
    return res.sendStatus(400);
  }

  // authorize if userId from JWT is the same as in userId param
  if (res.locals.userIdFromToken !== userId) {
    return res.sendStatus(401);
  }

  // validate user from client object
  const validationResults = await validate(userChangePassword);

  if (validationResults.length !== 0 || userChangePassword.newPassword != userChangePassword.newPasswordAgain) {
    return res.sendStatus(400);
  }

  const user = await databaseService.getUserById(userId);
  console.log(user);
  console.log(userId);

  if (!user) {
    return res.sendStatus(404);
  }

  try {
    // Check old password's validity
    const isValid = await bcrypt.compare(userChangePassword.oldPassword, user.passwordHash);

    if (!isValid) {
      // Cannot send 401 since it would force the client to logout
      return res.sendStatus(400);
    }

    // generate new password hash
    const hash = await bcrypt.hash(userChangePassword.newPassword, Constants.bcryptSaltRounds);

    // change password hash
    user.passwordHash = hash;

    // store in DB
    const updatedUser = await databaseService.updateUser(user);

    if (updatedUser) {
      return res.send(new UserToClient(updatedUser, token));
    } else {
      return res.sendStatus(503);
    }
  } catch (error) {
    console.log(error);
    return res.sendStatus(503);
  }
});

module.exports = router;