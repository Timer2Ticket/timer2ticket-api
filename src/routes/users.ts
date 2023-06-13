import express from 'express';
import { databaseService } from '../shared/database_service';
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';
import { validate } from 'class-validator';
import { PatchUserFromClient } from '../models/user/from_client/patch_user_from_client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ManagementClient = require('auth0').ManagementClient;

const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());
// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Users router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');

  next();
});

/**
 * Get user with auth0UserId in parameter. If user doesn't exist, create new one.
 */
router.get('/', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;

  const user = await databaseService.getUserByAuth0UserId(auth0UserId);

  // Return user if exists
  if (user) {
    return res.send(user);
  }

    try {
    // get user e-mail if exists
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const userInfo = await authCommons.geUserInfo(req.auth.token);
    if (!userInfo) {
      return res.sendStatus(503);
    }

    // create new user
    const newUser = await databaseService.createUser(auth0UserId, userInfo.body.email);

    if (Constants.isCommercialVersion && newUser && newUser._id) {
      // create new membershipInfo
      await databaseService.createMembershipInfo(newUser._id);
    }

    return res.send(newUser);
  } catch (ex) {
    return res.sendStatus(503);
  }
});

/**
 * Delete user with auth0UserId in parameter.
 */
// router.delete('/', authCommons.checkJwt, async (req, res) => {
//   if (!authCommons.authorizeUser(req)) {
//     return res.sendStatus(401);
//   }
//
//   const management = getManagementClient();
//
//   let isSuccessful = true;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   await management.deleteUser({ id: req.params.auth0UserId }, function(err: any, response: any) {
//     if (err) {
//       isSuccessful = false;
//     }
//   });
//
//   if (!isSuccessful) {
//     return res.status(503).send('Error while deleting user');
//   }
//
//   res.sendStatus(204);
// });

/**
 * Update user with auth0UserId in parameter.
 * Enabled fields to update: email, notifications.syncProblemsInfo, timeZone.
 */
router.patch('/', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const fromClient: PatchUserFromClient = new PatchUserFromClient(req.body);
  const validationResults = await validate(fromClient);
  if (validationResults.length > 0) {
    return res.status(400).send('Incorrect request body: ' + JSON.stringify(validationResults));
  }

  const auth0UserId = req.params.auth0UserId;
  const user = await databaseService.getUserByAuth0UserId(auth0UserId);
  if (!user) {
    return res.send(404).send('User not found');
  }

  if ('email' in req.body) {
    if (user.email) {
      return res.status(400).send('Email is already set!');
    }
    user.email = fromClient.email;
  }

  if ('syncProblemsInfo' in req.body && fromClient.syncProblemsInfo !== null) {
    user.notifiactionSettings.syncProblemsInfo = fromClient.syncProblemsInfo;
  }
  if ('timeZone' in req.body && fromClient.timeZone) {
    user.timeZone = fromClient.timeZone;
  }

  const updatedUser = await databaseService.updateUser(user._id, user);
  if (!updatedUser) {
    return res.status(503).send('Error while updating user');
  }

  return res.status(200).send(updatedUser);
});

/**
 * Ask for change password URL (auth0) for user with auth0UserId in parameter.
 */
router.post('/changePassword', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  if(!req.params.auth0UserId.startsWith('auth0|')) {
    return res.status(400).send('Unable to change password for user using social login.');
  }

  const management = getManagementClient();
  const data = {
    result_url: `${req.get('origin')}/profile/settings`,
    user_id: req.params.auth0UserId,
  };

  let response;
  try{
    response = await management.createPasswordChangeTicket(data);
  } catch (ex) {
    return res.status(503).send('Error while creating password change ticket');
  }

  res.status(200).send(response.ticket);
});

function getManagementClient() {
  return new ManagementClient({
    domain: Constants.authManagementDomain,
    clientId: Constants.authManagementClientId,
    clientSecret: Constants.authManagementClientSecret,
  });
}


module.exports = router;
