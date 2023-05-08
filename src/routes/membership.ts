import express from 'express';
import { authCommons } from '../shared/auth_commons';
import { Constants } from '../shared/constants';
import { databaseService } from '../shared/database_service';
import { MembershipInfoToUser } from '../models/commrecial/membership/membership_info_to_user';

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

  next();
});

/**
 * Returns user's membership info
 * If IS_COMMERCIAL_VERSION is false, returns 403
 * Note: membership info is created when user is created
 */
router.get('/',authCommons.checkJwt, async (req, res) => {
  if(!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  if (!Constants.IS_COMMERCIAL_VERSION) {
    return res.sendStatus(403);
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
  const membershipId = membershipInfo.currentMembership;

  let membership = null;
  if (membershipId) {
    membership = await databaseService.getMembershipById(membershipId);
  }
  return res.send(new MembershipInfoToUser(membershipInfo, membership));
});

/**
 * Assign membership by name in body param membershipName to user with auth0UserId in parameter
 * Memberships are defined in membership mongo collection
 * If IS_COMMERCIAL_VERSION is false, returns 403
 */
router.put('/',authCommons.checkJwt, async (req, res) => {
  if(!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  if (!Constants.IS_COMMERCIAL_VERSION) {
    return res.sendStatus(403);
  }

  const auth0UserId = req.params.auth0UserId;
  const membershipName = req.body.membershipName;

  const membership = await databaseService.getActiveMembershipByName(membershipName);
  if (!membership) {
    return res.sendStatus(400);
  }

  const user = await databaseService.getUserByAuth0UserId(auth0UserId);
  const userId = user?._id;
  if (!userId) {
    return res.sendStatus(500);
  }

  const membershipInfo = await databaseService.getMembershipInfoByUserId(userId);
  if (!membershipInfo) {
    return res.sendStatus(500);
  }

  membershipInfo.currentMembership = membership._id;

  const membershipInfoUpdated = await databaseService.updateMembershipInfo(userId, membershipInfo);
  if (!membershipInfoUpdated) {
    return res.sendStatus(500);
  }

  return res.send(new MembershipInfoToUser(membershipInfoUpdated, membership));
});

module.exports = router;