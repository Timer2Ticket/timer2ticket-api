import express from 'express'
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';
import { User } from '../models/user/user';
import { WebhookEvent } from '../enums/webhookEvents';
import { WebhookEventObjectType } from '../enums/webhookServiceObjectType';
import { databaseService } from '../shared/database_service';


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


router.post('/jira', async (req, res) => {
    let body
    if (req.body)
        body = req.body
    console.log(body)
    //get webhook type
    const event = _getJiraWebhookEvent(body)
    if (event === WebhookEvent.Error) return
    const eventObject = _getJiraEventObjectType(body)
    if (eventObject === WebhookEventObjectType.Error) return
    //get user
    const accountId = _getJiraUserId(body, eventObject)
    if (!accountId)
        return
    //get connections (there may be more, I have to work with all of them)
    const connections = await databaseService.getConnectionByServiceAccountId(accountId)
    if (!connections)
        return
    //check subscription todo
    //tell Core to do something
    const newObject = _getJiraObject(body, eventObject)


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
    const event = webhookEvent.split(':')[1].split('_')[0]
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
    } else {
        if (body.user && body.user.accountId)
            return body.user.accountId
        else
            return null
    }
}

function _getJiraObject(body: any, objType: WebhookEventObjectType): any {
    if (objType === WebhookEventObjectType.Worklog) {
        //data for new Time Entry
        return {}
    } else { // issue or project
        //data for ServiceObject
        return {}
        // newObject = {
        //     id: 1, //issue or project ID
        //     name: 'name',
        //     type: 'type',
        //     projectId: 1
        // }
    }
}

module.exports = router