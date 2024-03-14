import express from 'express'
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';
import { User } from '../models/user/user';
import { WebhookEvent } from '../enums/webhookEvents';
import { WebhookEventObjectType } from '../enums/webhookServiceObjectType';
import { databaseService } from '../shared/database_service';
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
    //get connections (there may be more, I have to work with all of them)
    const connection = await databaseService.getConnectionById(connectionId)
    if (!connection) {
        console.log('unable to get COnnection')
        return
    }
    //check subscription
    const subscriptionAllowsWebhooks = _checkSubscriptionForWebhook(connection)
    if (!subscriptionAllowsWebhooks) {
        console.log('unsupported subscription for webhooks')
        return
    }


    const accept = _acceptWebhook(connection, event, eventObject, true)
    if (!accept) {
        console.log('unsupported type of webhook')
        return
    }
    //get service in case of worklog
    const webhookObject = _getJiraWebhookObject(body, event, eventObject, connection)
    if (!webhookObject)
        return
    //   console.log(webhookObject)
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
    if (duration <= 0 || (!tagIds && !projectId)) //time entry is not complete yet
        return

    let connectionId
    try {
        connectionId = new ObjectId(req.params.connectionId);
    } catch (err: any) {
        console.log('unable to get connection Id')
        return
    }
    const connection = await databaseService.getConnectionById(connectionId)
    if (!connection)
        return
    const serviceNumber = connection.firstService.name === "Toggl Track" ? 1 : 2
    const event = action === "created" ? WebhookEvent.Created : (action === "updated" ? WebhookEvent.Updated : WebhookEvent.Deleted)
    const newWorklogObject = new WebhookEventData(WebhookEventObjectType.Worklog, teId, event, timestamp, connectionId, serviceNumber)
    //notify core
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
        || (connection.timeEntrySyncJobDefinition.status !== "SUCCESS" && eventObject === WebhookEventObjectType.Worklog))
        return false

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

async function _getJiraIssue(service: SyncedService, issueId: number): Promise<any | null> {
    if (service.name !== 'Jira')
        return null
    const jiraDomain = service.config.domain!
    const apiKey = service.config.apiKey
    const userEmail = service.config.userEmail!
    const response = await getJiraIssueById(jiraDomain, apiKey, userEmail, issueId)
    if (!response || typeof response === 'number')
        return null
    else if (response.body && response.body.fields && response.body.fields.project && response.body.fields.project.id)
        return response.body
    return null
}

function _checkSubscriptionForWebhook(connection: Connection): boolean {
    return true
    //TODO do better in comertial version
}

module.exports = router