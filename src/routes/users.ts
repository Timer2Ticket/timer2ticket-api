import express from 'express';
import { databaseService } from '../shared/database_service';
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';

const router = express.Router({ mergeParams: true });
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
router.get('/', authCommons.checkJwt, async (req, res) => {
  if(!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;

  const user = await databaseService.getUserByAuth0UserId(auth0UserId);

  // Return user if exists
  if (user) {
    return res.send(user);
  }

  try {
    // create new user
    const newUser = await databaseService.createUser(auth0UserId);

    if (Constants.IS_COMMERCIAL_VERSION && newUser && newUser._id) {
      // create new membershipInfo
      await databaseService.createMembershipInfo(newUser._id);
    }

    return res.send(newUser);
  } catch (ex) {
    return res.sendStatus(503);
  }
});

module.exports = router;
