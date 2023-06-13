import express from 'express';
import { Constants } from '../../shared/constants';
import { databaseService } from '../../shared/database_service';
import { MembershipInfo } from '../../models/commrecial/membership_info';

const router = express.Router({ mergeParams: true });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const t2tLib = require('timer2ticket-backend-library');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bodyParser = require('body-parser');
router.use(bodyParser.raw({ type: '*/*' }));

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Stripe public router calls at time: ${Date.now()}`);

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

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  const event = await t2tLib.stripeCommons.constructEvent(req.body.toString(), sig);

  if (!event) {
    return res.status(400).send(`Webhook Error`);
  }

  // Return a 200 response to acknowledge receipt of the event, then handle the event
  res.sendStatus(200);

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.updated':
      await processSubscriptionUpdated(event.data.object);
      break;
    // ... handle other event types
    case 'customer.subscription.deleted':
      await processSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await processPaymentSucceeded(event.data.object);
      break;
  }
});

async function processSubscriptionUpdated(data: any) {
  const stripeCustomerId = data.customer;
  const stripeSubscriptionId = data.id;
  const stripePriceId = data.items.data[0].price.id;
  const numberOfConnections = parseInt(data.items.data[0].quantity);
  const subscriptionEnds = parseInt(data.current_period_end);

  const membershipName = await t2tLib.getMembershipNameByPriceId(stripePriceId);

  const user = await databaseService.updateMembershipInfoStripeSubscription(
    stripeCustomerId,
    stripeSubscriptionId,
    membershipName,
    subscriptionEnds,
    numberOfConnections,
  );
}

async function processSubscriptionDeleted(data: any) {
  const stripeCustomerId = data.customer;
  const stripeSubscriptionId = data.id;

  const user = await databaseService.deleteMembershipInfoStripeSubscription(
    stripeCustomerId,
    stripeSubscriptionId,
  );
}

async function processPaymentSucceeded(data: any) {
  const stripeCustomerId = data.customer;
  const stripePriceId = data.lines.data[0].price.id;
  const billingReason = data.billing_reason;

  // only for buy immediate syncs
  if (stripePriceId === t2tLib.ImmediateSyncs.stripePriceId) {
    processImmediateSyncsBuy(stripeCustomerId, data);
  } else if (billingReason === 'subscription_create') {
    // only for new subscription
    processSubscriptionCreated(stripeCustomerId, data);
  }
}

async function processSubscriptionCreated(stripeCustomerId: string, data: any) {
  const stripeSubscriptionId = data.lines.data[0].subscription;
  const stripePriceId = data.lines.data[0].price.id;
  const numberOfConnections = parseInt(data.lines.data[0].quantity) + parseInt(data.lines.data[1].quantity);
  const subscriptionEnds = parseInt(data.lines.data[0].period.end);

  const membershipName = await t2tLib.getMembershipNameByPriceId(stripePriceId);

  const user = await databaseService.createMembershipInfoStripeSubscription(
    stripeCustomerId,
    stripeSubscriptionId,
    membershipName,
    subscriptionEnds,
    numberOfConnections,
  );
}

async function processImmediateSyncsBuy(stripeCustomerId: string, data: any) {
  const amount = parseInt(data.amount_paid) / 100;
  const quantity = parseInt(data.lines.data[0].quantity);

  const membershipInfo = await databaseService.addImmediateSync(stripeCustomerId, quantity);

  if (membershipInfo) {
    await createBuyImmediateSyncsLog(membershipInfo, stripeCustomerId, quantity, amount);
  }

}

async function createBuyImmediateSyncsLog(membershipInfo: MembershipInfo, stripeCustomerId: string, quantity: number, amount: number) {
  const timeNow = Math.floor(Date.now() / 1000);
  const immediateSyncLogDescription = `Buy ${quantity} immediate syncs for $${amount}`;
  await databaseService.createImmediateSyncLog(membershipInfo.userId, membershipInfo.currentImmediateSyncs, quantity, timeNow, 'BUY', null, immediateSyncLogDescription);

}

module.exports = router;
