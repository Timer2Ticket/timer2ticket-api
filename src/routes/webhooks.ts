import express from 'express'
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';
import { User } from '../models/user/user';
import { WebhookEvent } from '../enums/webhookEvents';
import { WebhookEventObjectType } from '../enums/webhookServiceObjectType';
import { DatabaseService, databaseService } from '../shared/database_service';
import { coreService } from '../shared/core_service';
import { ObjectId } from 'mongodb';
import { Connection } from '../models/connection/connection';
import { getJiraIssueById } from '../shared/services_config_functions';
import { Service } from 'ts-node';
import { SyncedService } from '../models/connection/config/synced_service';
import { timeStamp } from 'console';
import { WebhookEventData } from '../models/connection/config/webhook_event_data';


const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.use((req, res, next) => {
    console.log(`webhook router calls at time: ${Date().toString()}`);

    // // For CORS policy
    // res.append('Access-Control-Allow-Origin', ['*']);
    // res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    // res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');
    next();
});



// eslint-disable-next-line @typescript-eslint/no-explicit-any
let t2tLib: any;
if (Constants.isCommercialVersion) {
    t2tLib = require('@timer2ticket/timer2ticket-backend-library');
}


router.post('/jira/:connectionId', async (req, res) => {
    res.sendStatus(200)
    if (!req.body)
        return
    let connectionId
    try {
        connectionId = new ObjectId(req.params.connectionId);
    } catch (err: any) {
        console.log('unable to get connection Id')
        return
    }
    //get webhook type
    const body = req.body
    const event = _getJiraWebhookEvent(body)
    if (event === WebhookEvent.Error) {
        console.log('unable to read event')
        return
    }
    const eventObject = _getJiraEventObjectType(body)
    if (eventObject === WebhookEventObjectType.Error) {
        console.log('unable to read object from webhook')
        return
    }
    //get user
    const accountId = _getJiraUserId(body, eventObject)
    if (!accountId)
        return
    //get connection
    const connection = await databaseService.getConnectionById(connectionId)
    if (!connection) {
        console.log('unable to get COnnection')
        return
    }
    //check subscription
    const subscriptionAllowsWebhooks = await _checkSubscriptionForWebhook(connection)
    if (!subscriptionAllowsWebhooks) {
        console.log('unsupported subscription for webhooks')
        return
    }


    const accept = _acceptWebhook(connection, event, eventObject, true) // TODO decide if you need to know if primary service called
    if (!accept) {
        console.log('unsupported type of webhook')
        return
    }
    //get service in case of worklog
    const webhookObject = _getJiraWebhookObject(body, event, eventObject, connection)
    if (!webhookObject)
        return
    //   console.log(webhookObject)
    const cycleSafeWebhook = await _isWebhookCykleSafe(connection, event, eventObject, webhookObject)
    if (!cycleSafeWebhook)
        return
    const coreResponse = await coreService.postWebhook(webhookObject)
    console.log('core responded ')
})

router.post('/toggl_track/:connectionId', async (req, res) => {
    //need to be able to validate creating a webhook
    console.log('toggl track called')
    if (req.body && req.body.payload && req.body.payload === 'ping' && req.body.validation_code) {
        const validationCode = req.body.validation_code
        res.json({ validation_code: validationCode })
    } else {
        res.sendStatus(200)
    }
    let duration, action, teId, timestamp, tagIds, projectId
    try {
        action = req.body.metadata.action
        teId = req.body.metadata.time_entry_id
        timestamp = new Date(req.body.timestamp)
        duration = req.body.payload.duration
        tagIds = req.body.payload.tag_ids
        projectId = req.body.payload.project_id
    } catch (ex: any) {
        console.log('something went wrong while getting webhook data')
        return
    }
    if (duration <= 0 || (!tagIds && !projectId)) { //time entry is not complete yet
        console.log('time entry is not complete yet')
        return
    }

    let connectionId
    try {
        connectionId = new ObjectId(req.params.connectionId);
    } catch (err: any) {
        console.log('unable to get connection Id')
        return
    }
    const connection = await databaseService.getConnectionById(connectionId)
    if (!connection) {
        console.log('couldnt get connection by Id')
        return
    }

    //check subscription
    const subscriptionAllowsWebhooks = await _checkSubscriptionForWebhook(connection)
    if (!subscriptionAllowsWebhooks) {
        console.log('unsupported subscription for webhooks')
        return
    }

    const serviceNumber = connection.firstService.name === "Toggl Track" ? 1 : 2
    const event = action === "created" ? WebhookEvent.Created : (action === "updated" ? WebhookEvent.Updated : WebhookEvent.Deleted)
    const acceptWebhook = _acceptWebhook(connection, event, WebhookEventObjectType.Worklog, false)
    if (!acceptWebhook) {
        console.log('webhook not accepted')
        return
    }
    const newWorklogObject = new WebhookEventData(WebhookEventObjectType.Worklog, teId, event, timestamp, connectionId, serviceNumber)
    const isCycleSafe = await _isWebhookCykleSafe(connection, event, WebhookEventObjectType.Worklog, newWorklogObject)
    if (!isCycleSafe) {
        console.log('toggl webhook not cycle safe')
        return
    }
    console.log(newWorklogObject)
    const coreResponse = await coreService.postWebhook(newWorklogObject)
})



function _getJiraWebhookEvent(body: any): WebhookEvent {
    let webhookEvent
    if (body.webhookEvent) webhookEvent = body.webhookEvent
    else return WebhookEvent.Error
    const splitOnColon = webhookEvent.split(':')
    const event = splitOnColon[splitOnColon.length - 1].split('_')[1]
    if (event === 'created')
        return WebhookEvent.Created
    else if (event === 'updated')
        return WebhookEvent.Updated
    else if (event === 'deleted')
        return WebhookEvent.Deleted
    else
        return WebhookEvent.Error
}
function _getJiraEventObjectType(body: any): WebhookEventObjectType {
    let webhookEvent
    if (body.webhookEvent) webhookEvent = body.webhookEvent
    else return WebhookEventObjectType.Error
    const splitOnColon = webhookEvent.split(':')
    const event = splitOnColon[splitOnColon.length - 1].split('_')[0]
    if (event === 'issue')
        return WebhookEventObjectType.Issue
    else if (event === 'project')
        return WebhookEventObjectType.Project
    else if (event === 'worklog')
        return WebhookEventObjectType.Worklog
    else
        return WebhookEventObjectType.Error
}

function _getJiraUserId(body: any, objType: WebhookEventObjectType): string | null {
    if (objType === WebhookEventObjectType.Worklog) {
        if (body.worklog && body.worklog.author && body.worklog.author.accountId)
            return body.worklog.author.accountId
        else
            return null
    } else if (objType === WebhookEventObjectType.Issue) {
        if (body.user && body.user.accountId)
            return body.user.accountId
        else
            return null
    } else {
        if (body.project && body.project.projectLead && body.project.projectLead.accountId)
            return body.project.projectLead.accountId
        else
            return null
    }
}

function _getJiraWebhookObject(body: any, event: WebhookEvent, objType: WebhookEventObjectType, connection: Connection): WebhookEventData | null {
    const serviceNumber = connection.firstService.name === 'Jira' ? 1 : 2
    if (objType === WebhookEventObjectType.Worklog) {
        //data for new Time Entry
        if (body.worklog && body.worklog.issueId && body.worklog.id && body.worklog.started && body.worklog.timeSpentSeconds) {
            return new WebhookEventData(objType, `${body.worklog.issueId}_${body.worklog.id}`, event, body.timestamp, connection._id, serviceNumber)
        } else
            return null
    } else if (objType === WebhookEventObjectType.Issue) {
        //data for Issue ServiceObject
        if (body.issue && body.issue.id && body.issue.fields && body.issue.fields.summary && body.issue.fields.project && body.issue.fields.project.id)
            return new WebhookEventData(objType, body.issue.id, event, body.timestamp, connection._id, serviceNumber)
        else return null
    } else { // project
        if (body.project && body.project.id && body.project.name)
            return new WebhookEventData(objType, body.project.id, event, body.timestamp, connection._id, serviceNumber)
        else return null
    }
}

function _acceptWebhook(connection: Connection, event: WebhookEvent, eventObject: WebhookEventObjectType, primaryServiceCalled: boolean): boolean {
    if (!connection.isActive
        || (connection.configSyncJobDefinition.status !== "SUCCESS" && (eventObject === WebhookEventObjectType.Issue || eventObject === WebhookEventObjectType.Project))
        || (connection.timeEntrySyncJobDefinition.status !== "SUCCESS" && eventObject === WebhookEventObjectType.Worklog)) {
        return false
    }
    const delta: number | null = eventObject === WebhookEventObjectType.Worklog ?
        (connection.timeEntrySyncJobDefinition.lastJobTime ? Date.now() - connection.timeEntrySyncJobDefinition.lastJobTime : null) :
        (connection.configSyncJobDefinition.lastJobTime ? Date.now() - connection.configSyncJobDefinition.lastJobTime : null)
    if (!delta || delta < Constants.webhooksAntiCycleTimeout) { // do not accept minute after sync job
        return false
    }
    if (primaryServiceCalled) {
        return true //TODO decide if ignore delete
    } else { //secondary
        if (eventObject === WebhookEventObjectType.Worklog) {
            return true
        } else {
            // I don care about projects and tasks in second tool
            return false
        }
    }
}

async function _checkSubscriptionForWebhook(connection: Connection): Promise<boolean> {
    if (Constants.isCommercialVersion) {
        const membershipInfo = await databaseService.getMembershipInfoByUserId(connection.userId)
        if (membershipInfo && membershipInfo.currentMembership === "Senior") {
            return true
        } else {
            return false
        }
    } else {
        return true
    }
}

/*
* checks if current webhook call is result of previous Timer2Ticekt activity to avoid infinite cycling
* returns true if is safe to proceed -> safe to continue
* returns false othewise -> webhook should not be accepted
*/
async function _isWebhookCykleSafe(connection: Connection, event: WebhookEvent, eventObject: WebhookEventObjectType, webhookObject: WebhookEventData): Promise<boolean> {
    console.log('about to check if wh is cycle safe')
    if (webhookObject.type === WebhookEventObjectType.Issue || webhookObject.type === WebhookEventObjectType.Project) {
        const mapping = connection.mappings.find(mapping => {
            return mapping.mappingsObjects[0].id == webhookObject.id || mapping.mappingsObjects[1].id == webhookObject.id
        })
        if (!mapping) // mapping does not exist, that means this a fisrt call for this object -> save to proceed
            return true
        const callingService = webhookObject.serviceNumber === 1 ? connection.firstService.name : connection.secondService.name
        const delta = callingService == mapping.mappingsObjects[0].service ?
            (Date.now() - mapping.mappingsObjects[1].lastUpdated) :
            (Date.now() - mapping.mappingsObjects[0].lastUpdated)
        //modified not that long ago -> get rid of it
        //modified > than treshold ago -> it is ok to proceed
        return delta > Constants.webhooksAntiCycleTimeout
    } else if (webhookObject.type === WebhookEventObjectType.Worklog) {
        const TESO = await databaseService.getTimeEntrySyncedObjectByOneOfTheServicesTEId(connection._id, webhookObject.id)
        if (!TESO) { // no teso, new Call -> safe to proceed
            return true
        }
        const delta = Date.now() - TESO.lastUpdated
        //modified not that long ago -> get rid of it
        //modified > than treshold ago -> it is ok to proceed
        return delta > Constants.webhooksAntiCycleTimeout
    } else { //ERROR
        return false
    }
}

module.exports = router