import express from 'express';
import { Constants } from '../../shared/constants';
import { databaseService } from '../../shared/database_service';
import { MembershipInfo } from '../../models/commrecial/membership_info';
import { ObjectId } from 'mongodb';
import { Connection } from '../../models/connection/connection';
import { translateService } from '../../shared/translate_service';
import { sendEmail } from '../../shared/email_service';
import { coreService } from '../../shared/core_service';

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
      await processInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.marked_uncollectible':
      await voidInvoice(event.data.object.id);
  }
});

async function voidInvoice(invoiceId: string) {
  t2tLib.stripeCommons.voidInvoice(invoiceId);
}

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

  if (user) {
    await reconfigureConnections(user, membershipName, numberOfConnections);
  }
}

async function processSubscriptionDeleted(data: any) {
  const stripeCustomerId = data.customer;
  const stripeSubscriptionId = data.id;

  const user = await databaseService.deleteMembershipInfoStripeSubscription(
    stripeCustomerId,
    stripeSubscriptionId,
  );

  if (user) {
    // Hobby membership because when user reactivate the subscription, it will be at least Hobby
    // So the configuration of all connection will correspond to Hobby parameters
    await reconfigureConnections(user, 'Hobby', 0);
  }
}

async function processInvoicePaymentSucceeded(data: any) {
  const stripeCustomerId = data.customer;
  const stripePriceId = data.lines.data[0].price.id;
  const billingReason = data.billing_reason;

  // only for buy immediate syncs
  if (stripePriceId === t2tLib.ImmediateSyncs.stripePriceId) {
    await processImmediateSyncsBuy(stripeCustomerId, data);
  } else if (billingReason === 'subscription_create') {
    // only for new subscription
    await processSubscriptionCreated(stripeCustomerId, data);
  }

  saveInvoiceToFakturoid(data);
}

async function saveInvoiceToFakturoid(data: any) {
  const customerStripeId = data.customer;
  const customerInfo = await databaseService.getMembershipInfoByStripeCustomerId(customerStripeId);
  if(!customerInfo) {
    return;
  }

  let fakturoidSubjectId = customerInfo.fakturoidSubjectId;
  if(!fakturoidSubjectId) {
    // create subject in fakturoid
    const response = await t2tLib.fakturoidCommons.createSubject(data);
    if(!response) {
      return;
    }
    fakturoidSubjectId = response.body.id;
    if(fakturoidSubjectId) {
      await databaseService.updateFakturoidSubjectId(customerInfo.userId, fakturoidSubjectId);
    }
  } else {
    // update subject in fakturoid
    const response = await t2tLib.fakturoidCommons.updateSubject(data, fakturoidSubjectId);
    if(!response) {
      return;
    }
  }

  // create invoice in fakturoid
  const response = await t2tLib.fakturoidCommons.createInvoice(data, fakturoidSubjectId);
  if(!response) {
    return;
  }

  // make invoice as paid in fakturoid
  const invoiceId = response.body.id;
  t2tLib.fakturoidCommons.markInvoiceAsPaid(invoiceId);
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
  const timeNow = Math.floor(Date.now());
  const immediateSyncLogDescription = `Buy ${quantity} immediate syncs for $${amount}`;
  await databaseService.createImmediateSyncLog(membershipInfo.userId, membershipInfo.currentImmediateSyncs, quantity, timeNow, 'BUY', null, immediateSyncLogDescription);
}

async function reconfigureConnections(oldMembershipInfo: MembershipInfo, newMembershipName: string, newNumberOfConnections: number) {
  const userId = oldMembershipInfo.userId;
  const numberOfActiveConnections = oldMembershipInfo.currentActiveConnections;

  const numberToDeactivate = numberOfActiveConnections - newNumberOfConnections;
  const modifiedConnectionsIds: string[] = [];
  const deactivatedConnections: string[] = [];
  const changedConfigConnections: string[] = [];
  if (numberToDeactivate > 0) {
    const deactivated = await deactivateConnections(userId, numberToDeactivate);
    for (let i = 0; i < deactivated.length; i++) {
      modifiedConnectionsIds.push(deactivated[i]._id.toHexString());
      deactivatedConnections.push(Connection.getConnectionBetweenString(deactivated[i]));
    }
  }

  const oldMembershipConfig = t2tLib.getMembershipConfig(oldMembershipInfo.currentMembership);
  const newMembershipConfig = t2tLib.getMembershipConfig(newMembershipName);

  if (newMembershipConfig.membershipTier < oldMembershipConfig.membershipTier) {
    const modified = await updateConnectionsSynchronizationSchedulesByMembership(userId, newMembershipConfig);
    for (let i = 0; i < modified.length; i++) {
      modifiedConnectionsIds.push(modified[i]._id.toHexString());
      changedConfigConnections.push(Connection.getConnectionBetweenString(modified[i]));
    }
  }

  if (modifiedConnectionsIds.length > 0) {
    // no need to wait
    sendNotifycationEmail(userId, deactivatedConnections, changedConfigConnections);

    // no need to wait
    coreService.updateConnections(modifiedConnectionsIds);
  }
}

async function sendNotifycationEmail(userId: ObjectId, deactivatedConnections: string[], changedConfigConnections: string[]) {
  const user = await databaseService.getUserById(userId);
  if (!user || !user.email) {
    return;
  }
  const language = 'en';

  const emailMessage = getChangedConnectionsEmailMessage(language, deactivatedConnections, changedConfigConnections);

  sendEmail(
    user.email,
    language,
    translateService.get(language, 'emailNotifyMembershipChangesSubject'),
    emailMessage,
  );
}

function getChangedConnectionsEmailMessage(language: string, deactivatedConnections: string[], changedConfigConnections: string[]) {
  let message = '';
  message += translateService.get(language, 'emailNotifyMembershipChangesBodyBegin');

  if (deactivatedConnections.length > 0 && changedConfigConnections.length > 0) {
    message += translateService.get(language, 'emailNotifyMembershipChangesBodySyncSchedule')
      .replace(/{{ connections }}/g, changedConfigConnections.toString());
    message += translateService.get(language, 'emailNotifyMembershipChangesBodyAnd');
    message += translateService.get(language, 'emailNotifyMembershipChangesBodyDeactiavted')
      .replace(/{{ connections }}/g, deactivatedConnections.toString());
  } else if (deactivatedConnections.length > 0) {
    message += translateService.get(language, 'emailNotifyMembershipChangesBodyDeactiavted')
      .replace(/{{ connections }}/g, deactivatedConnections.toString());
  } else if (changedConfigConnections.length > 0) {
    message += translateService.get(language, 'emailNotifyMembershipChangesBodySyncSchedule')
      .replace(/{{ connections }}/g, changedConfigConnections.toString());
  }

  message += translateService.get(language, 'emailNotifyMembershipChangesBodyEnd');
  return message;
}

async function updateConnectionsSynchronizationSchedulesByMembership(userId: ObjectId, currentMembershipConfig: any): Promise<Connection[]> {
  const modifiedConnections: Connection[] = [];
  const connections = await databaseService.getConnectionsByUserId(userId);
  if (!connections) {
    return modifiedConnections;
  }

  for (let i = 0; i < connections.length; i++) {
    const modified = updateConnectionSynchonizationSchedule(connections[i], currentMembershipConfig);
    if (modified) {
      await databaseService.updateConnectionSyncJobConfig(connections[i]);
      modifiedConnections.push(connections[i]);
    }
  }

  return modifiedConnections;
}

function updateConnectionSynchonizationSchedule(connection: Connection, currentMembershipConfig: any) {
  let isModified = false;

  if (!currentMembershipConfig.isSyncEveryHourEnabled && connection.configSyncJobDefinition.everyHour) {
    connection.configSyncJobDefinition.everyHour = false;
    isModified = true;
  }
  if (!currentMembershipConfig.isSyncEveryHourEnabled && connection.timeEntrySyncJobDefinition.everyHour) {
    connection.timeEntrySyncJobDefinition.everyHour = false;
    isModified = true;
  }

  if (!currentMembershipConfig.isSyncEveryDayEnabled && connection.configSyncJobDefinition.selectionOfDays.length > 1) {
    connection.configSyncJobDefinition.selectionOfDays.sort((a, b) => a - b);
    connection.configSyncJobDefinition.selectionOfDays = [connection.configSyncJobDefinition.selectionOfDays[0]];
    isModified = true;
  }

  if (!currentMembershipConfig.isSyncEveryDayEnabled && connection.timeEntrySyncJobDefinition.selectionOfDays.length > 1) {
    connection.timeEntrySyncJobDefinition.selectionOfDays.sort((a, b) => a - b);
    connection.timeEntrySyncJobDefinition.selectionOfDays = [connection.timeEntrySyncJobDefinition.selectionOfDays[0]];
    isModified = true;
  }

  if (isModified) {
    connection.configSyncJobDefinition.schedule = t2tLib.ValidateMembership.getCronString(
      connection.configSyncJobDefinition.syncTime,
      connection.configSyncJobDefinition.everyHour,
      connection.configSyncJobDefinition.selectionOfDays,
    );
    connection.timeEntrySyncJobDefinition.schedule = t2tLib.ValidateMembership.getCronString(
      connection.timeEntrySyncJobDefinition.syncTime,
      connection.timeEntrySyncJobDefinition.everyHour,
      connection.timeEntrySyncJobDefinition.selectionOfDays,
    );
  }

  return isModified;
}

async function deactivateConnections(userId: ObjectId, numberToDeactivate: number): Promise<Connection[]> {
  const modifiedConnections: Connection[] = [];
  const connectionsToDeactive = await databaseService.getActiveConnectionsByUserId(userId, numberToDeactivate);
  if (!connectionsToDeactive) {
    return modifiedConnections;
  }

  let deactivatedConnections = 0;

  for (let i = 0; i < connectionsToDeactive.length; i++) {
    const result = await databaseService.deactivateConnection(connectionsToDeactive[i]._id);
    if (result) {
      modifiedConnections.push(connectionsToDeactive[i]);
      deactivatedConnections++;
    }
  }

  await databaseService.incrementActiveConnectionByAmount(userId, -deactivatedConnections);

  return modifiedConnections;
}

module.exports = router;
