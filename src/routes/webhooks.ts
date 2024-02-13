import express from 'express'
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';
import { User } from '../models/user/user';
import { WebhookEvent } from '../enums/webhookEvents';
import { WebhookServiceObjectType } from '../enums/webhookServiceObjectType';


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
    //get webhook type
    const event = _getJiraWebhookEvent(body)
    if (event === WebhookEvent.Error) return
    //get user
    const serviceObject = _getJiraServiceObjectType(body)
    if (serviceObject === WebhookServiceObjectType.Error) return
    //check subscription todo
    //get connection

    //update in second service
    //update mapping
})


function _getJiraWebhookEvent(body: any): WebhookEvent {
    let webhookEvent
    if (body.webhookEvent) webhookEvent = body.webhookEvent
    else return WebhookEvent.Error
    const event = webhookEvent.split(':')[1].split('_')[1]
    if (event === 'created')
        return WebhookEvent.Created
    else if (event === 'updated')
        return WebhookEvent.Updated
    else if (event === 'deleted')
        return WebhookEvent.Deleted
    else
        return WebhookEvent.Error
}
function _getJiraServiceObjectType(body: any): WebhookServiceObjectType {
    let webhookEvent
    if (body.webhookEvent) webhookEvent = body.webhookEvent
    else return WebhookServiceObjectType.Error
    const event = webhookEvent.split(':')[1].split('_')[0]
    if (event === 'issue')
        return WebhookServiceObjectType.Issue
    else if (event === 'project')
        return WebhookServiceObjectType.Project
    else
        return WebhookServiceObjectType.Error
}

module.exports = router