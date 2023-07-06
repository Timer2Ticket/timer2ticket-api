import express from 'express';
import { Constants } from '../../shared/constants';
import { authCommons } from '../../shared/auth_commons';
import { databaseService } from '../../shared/database_service';
import { User } from '../../models/user/user';
import { ImmediateSyncLog } from '../../models/commrecial/immediate_sync_log';

const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Sync logs router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');

  if (!Constants.isCommercialVersion) {
    return res.sendStatus(404);
  } else {
    next();
  }
});

/**
 * Returns user's sync logs.
 */
router.get('/', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;

  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(503).send('Error getting user');
  }

  const logs: ImmediateSyncLog[] = await databaseService.getImmediateSyncLogsByUserId(user._id);
  if (!logs) {
    return res.status(503).send('Error getting connections');
  }

  return res.status(200).send(logs);
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

module.exports = router;
