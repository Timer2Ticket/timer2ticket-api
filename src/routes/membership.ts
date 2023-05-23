import express from 'express';
import { authCommons } from '../shared/auth_commons';
import { Constants } from '../shared/constants';
import { databaseService } from '../shared/database_service';

const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());


// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Membership router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');

  if (!Constants.isCommercialVersion) {
    return res.sendStatus(403);
  } else {
    next();
  }
});

/**
 * Returns user's membership info
 * If isCommercialVersion is false, returns 403
 * Note: membership info is created when user is created
 */
router.get('/', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;

  const user = await databaseService.getUserByAuth0UserId(auth0UserId);
  const userId = user?._id;
  if (!userId) {
    return res.sendStatus(500);
  }

  const membershipInfo = await databaseService.getMembershipInfoByUserId(userId);
  if (!membershipInfo) {
    return res.sendStatus(500);
  }

  return res.send(membershipInfo);
});

module.exports = router;