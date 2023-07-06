import express from 'express';
import { Constants } from '../../shared/constants';
import { authCommons } from '../../shared/auth_commons';
import { User } from '../../models/user/user';
import { databaseService } from '../../shared/database_service';
import { MembershipInfo } from '../../models/commrecial/membership_info';
import { ObjectId } from 'mongodb';
import { MembershipFromClient } from '../../models/commrecial/from_client/membership_from_client';
import { validate } from 'class-validator';

const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// eslint-disable-next-line @typescript-eslint/no-var-requires
const t2tLib = require('timer2ticket-backend-library');

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Stripe router calls at time: ${Date.now()}`);

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

router.post('/membership', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const membershipFromClient: MembershipFromClient = new MembershipFromClient(req.body);
  const validationResults = await validate(membershipFromClient);
  if (validationResults.length > 0) {
    return res.status(400).send('Incorrect request body: ' + JSON.stringify(validationResults));
  }

  const auth0UserId = req.params.auth0UserId;

  // get user from database
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(503).send('Error getting user');
  }

  // get membership info from database
  let membershipInfo: MembershipInfo | undefined | null = await getMembershipInfo(user._id);
  if (!membershipInfo) {
    return res.status(503).send('Error getting membership info');
  }

  if(membershipInfo.stripeSubscriptionId) {
    return res.status(400).send('User already has a subscription');
  }

  if(membershipInfo.stripeLastSubscriptionSessionId) {
    t2tLib.stripeCommons.cancelCheckoutSession(membershipInfo.stripeLastSubscriptionSessionId);
  }

  // create stripe customer
  if(!membershipInfo.stripeCustomerId) {
    const stripeCustomerId = await t2tLib.stripeCommons.createCustomer(user._id.toHexString());
    if (!stripeCustomerId) {
      return res.status(503).send('Error creating stripe customer');
    }

    // update membership info in database
    membershipInfo = await databaseService.updateMembershipInfoStripeCustomerId(user._id, stripeCustomerId);
    if (!membershipInfo) {
      return res.status(503).send('Error updating membership info');
    }
  }

  // create stripe subscription link to payment page
  const stripeSubscriptionSession = await t2tLib.stripeCommons.createNewSubscriptionSession(membershipInfo.stripeCustomerId, membershipFromClient.name, membershipFromClient.connectionsOver);
  if (!stripeSubscriptionSession) {
    return res.status(503).send('Error creating stripe subscription');
  }

  const membershipInfoUpdated = await databaseService.saveLastSubscriptionSession(user._id, stripeSubscriptionSession.id);
  if (!membershipInfoUpdated) {
    return res.status(503).send('Error updating membership info');
  }

  return res.status(200).send(stripeSubscriptionSession.url);
});

router.post('/buyImmediateSyncs', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;
  const quantity = req.body.quantity;

  if(!t2tLib.validateImmediateSyncsQuantity(quantity)) {
    return res.status(400).send('Invalid quantity');
  }

  // get user from database
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(503).send('Error getting user');
  }

  // get membership info from database
  const membershipInfo: MembershipInfo | undefined | null = await getMembershipInfo(user._id);
  if (!membershipInfo) {
    return res.status(503).send('Error getting membership info');
  }

  // create stripe subscription link to payment page
  const stripeSubscriptionUrl = await t2tLib.stripeCommons.createBuyImmediateSyncsSession(membershipInfo.stripeCustomerId, quantity);
  if (!stripeSubscriptionUrl) {
    return res.status(503).send('Error creating stripe subscription');
  }
  return res.status(200).send(stripeSubscriptionUrl);
});

router.post('/customerPortal', authCommons.checkJwt, async (req, res) => {

  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  let returnUrlPath = ('returnUrlPath' in req.body) ? req.body.returnUrlPath : '/';
  if(!returnUrlPath.startsWith('/')) {
    returnUrlPath = '/' + returnUrlPath;
  }

  const auth0UserId = req.params.auth0UserId;
  const flowType = req.body.flowType;

  // get user from database
  const user: User | null = await getUserFromDatabase(auth0UserId);
  if (!user) {
    return res.status(503).send('Error getting user');
  }

  // get membership info from database
  const membershipInfo: MembershipInfo | undefined | null = await getMembershipInfo(user._id);
  if (!membershipInfo || !membershipInfo.stripeCustomerId) {
    return res.status(503).send('Error getting membership info');
  }

  // create stripe subscription link to payment page
  let customerPortalUrl;
  if(flowType === "subscription_update") {
    customerPortalUrl = await t2tLib.stripeCommons.getCustomerPortalLinkSubscription(membershipInfo.stripeCustomerId, membershipInfo.stripeSubscriptionId, `${req.get('origin')}${returnUrlPath}`);
  } else {
    customerPortalUrl = await t2tLib.stripeCommons.getCustomerPortalLink(membershipInfo.stripeCustomerId, `${req.get('origin')}${returnUrlPath}`);
  }
  if (!customerPortalUrl) {
    return res.status(503).send('Error getting customer portal url');
  }
  return res.status(200).send(customerPortalUrl);
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

async function getMembershipInfo(userId: ObjectId): Promise<MembershipInfo | null> {
  const user = await databaseService.getMembershipInfoByUserId(userId);
  if (!user) {
    return null;
  }
  return user;
}

module.exports = router;
