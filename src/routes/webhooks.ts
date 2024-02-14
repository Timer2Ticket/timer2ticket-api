import express from 'express'
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';
import { User } from '../models/user/user';
import { WebhookEvent } from '../enums/webhookEvents';
import { WebhookEventObjectType } from '../enums/webhookServiceObjectType';
import { databaseService } from '../shared/database_service';
import { coreService } from '../shared/core_service';
import { ObjectId } from 'mongodb';


const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.use((req, res, next) => {
    console.log(`webhook router calls at time: ${Date.now().toString()}`);

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
    //TODO validate sender
    if (!req.body)
        return
    let connectionId
    try {
        connectionId = new ObjectId(req.params.connectionId);
    } catch (err: any) {
        return
    }
    //get webhook type
    const body = req.body
    const event = _getJiraWebhookEvent(body)
    if (event === WebhookEvent.Error) return
    const eventObject = _getJiraEventObjectType(body)
    if (eventObject === WebhookEventObjectType.Error) return
    //get user
    const accountId = _getJiraUserId(body, eventObject)
    if (!accountId)
        return
    //get connections (there may be more, I have to work with all of them)
    const connection = await databaseService.getConnectionById(connectionId)
    if (!connection)
        return
    //check subscription todo
    let newObject
    if (event === WebhookEvent.Deleted)
        newObject = {}
    else {
        newObject = _getJiraObject(body, eventObject)
        if (!newObject)
            return
    }

    const data = {
        service: 'Jira',
        timestamp: body.timestamp,
        event: event,
        eventObject: eventObject,
        accountId: accountId,
        connection: connection,
        newObject: newObject
    }
    const coreResponse = await coreService.postWebhook(data)
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

function _getJiraObject(body: any, objType: WebhookEventObjectType): any {
    if (objType === WebhookEventObjectType.Worklog) {
        //data for new Time Entry
        if (body.worklog && body.worklog.issueId && body.worklog.id && body.worklog.started && body.worklog.timeSpentSeconds) {
            const worklog = body.worklog
            const durationInMilliseconds = worklog.timeSpentSeconds * 1000
            const start = new Date(worklog.started)
            const comment = worklog.comment ? worklog.comment : ''
            return {
                id: `${worklog.issueId}_${worklog.id}`,
                projectId: null,
                text: comment,
                start: start,
                end: new Date(start.getTime() + durationInMilliseconds),
                durationInMiliseconds: durationInMilliseconds,
            }
        } else
            return null
    } else if (objType === WebhookEventObjectType.Issue) { // issue
        //data for Issue ServiceObject
        if (body.issue && body.issue.id && body.issue.fields && body.issue.fields.summary && body.issue.fields.project && body.issue.fields.project.id)
            return {
                id: body.issue.id,
                name: body.issue.fields.summary,
                type: objType,
                projectId: body.issue.fields.project.id,
            }
        else return null
    } else { // project
        if (body.project && body.project.id && body.project.name)
            return {
                id: body.project.id,
                name: body.project.name,
                type: objType,
                projectId: body.project.id,
            }
        else return null
    }
}

module.exports = router