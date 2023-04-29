import express from 'express';
import { auth0Commons } from '../auth0/auth0_commons';
import { databaseService } from '../shared/database_service';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());


// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Users router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');

  next();
});

/**
 * Get user with auth0UserId in parameter. If user doesn't exist, create new one.
 */
router.get('/:auth0UserId', auth0Commons.checkJwt, async (req, res) => {
  const auth0UserId = req.params.auth0UserId;
  const token = req.header('Authorization');

  if (!auth0UserId || !token) {
    return res.sendStatus(400);
  }

  // token is valid because of auth0Commons.checkJwt token validation
  const jwtPayload = auth0Commons.getPayloadInfoFromToken(token.split(' ')[1]);
  if (!jwtPayload || !jwtPayload.sub) {
    return res.sendStatus(400);
  }

  // check if user is authorized to get this user
  if (jwtPayload.sub !== auth0UserId) {
    return res.sendStatus(401);
  }

  const user = await databaseService.getUserByAuth0UserId(auth0UserId);

  // Return user if exists
  if (user) {
    return res.send(user);
  }

  try {
    // create new user
    const newUser = await databaseService.createUser(auth0UserId)

    return res.send(newUser);
  } catch (ex) {
    console.log(ex);
    return res.sendStatus(503);
  }
});

module.exports = router;
