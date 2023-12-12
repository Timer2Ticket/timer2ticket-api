import express from 'express';
import superagent from 'superagent';
import { authCommons } from '../shared/auth_commons';
import {
  getJiraIssueFileds,
  getJiraIssueStatuses,
  getJiraProjects,
  getRedmineProjects,
  getRedmineTimeEntryActivities,
  getRedmineUserDetail,
  getTogglTrackUser,
  getTogglTrackWorkspaces,
} from '../shared/services_config_functions';
import { stat } from 'fs';
import { IssueState } from '../models/connection/config/issue_state';
import { Project } from '../models/connection/from_client/project';
import { CustomField } from '../models/connection/config/custom_field';


const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Synced services config router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');

  next();
});

/**
 * Gets TE activities from Redmine to show the user (on client) which activity would be default (user decides)
 * Also requests user detail (via provided redmine api key) to extract Redmine userId and send to user with activities as well (needed for sync Redmine requests, but can be hidden from the user)
 */
router.get('/redmine_time_entry_activities', authCommons.checkJwt, async (req, res) => {
  // those 2 are filled by user in the client form
  const redmineApiKey: string | undefined = req.query['api_key']?.toString();
  let redmineApiPoint: string | undefined = req.query['api_point']?.toString();
  // should validate too...

  if (!redmineApiKey || !redmineApiPoint) {
    return res.sendStatus(400);
  }

  // encode redmine api point
  redmineApiPoint = encodeURI(redmineApiPoint);

  const responseTimeEntryActivities: superagent.Response | number = await getRedmineTimeEntryActivities(redmineApiPoint, redmineApiKey);
  if (!responseTimeEntryActivities || typeof responseTimeEntryActivities === 'number') {
    // on error, response with status from Redmine
    let statusCode = 503;
    if (responseTimeEntryActivities && responseTimeEntryActivities !== 401) {
      statusCode = responseTimeEntryActivities;
    } else if (responseTimeEntryActivities && responseTimeEntryActivities === 401) {
      // do not send 401, it would lead to user logout on the client side due to error intercepting
      statusCode = 400;
    }

    return res.sendStatus(statusCode);
  }

  // need to grab userId (determined by api key provided)
  const responseUserDetail: superagent.Response | number = await getRedmineUserDetail(redmineApiPoint, redmineApiKey);
  if (!responseUserDetail || typeof responseUserDetail === 'number') {
    // on error, response with status from Redmine
    let statusCode = 503;
    if (responseUserDetail && responseUserDetail !== 401) {
      statusCode = responseUserDetail;
    } else if (responseUserDetail && responseUserDetail === 401) {
      // do not send 401, it would lead to user logout on the client side due to error intercepting
      statusCode = 400;
    }

    return res.sendStatus(statusCode);
  }

  try {
    // extract TE activities
    const timeEntryActivities: Record<string, unknown>[] = [];
    responseTimeEntryActivities.body['time_entry_activities'].forEach((timeEntryActivity: never) => {
      timeEntryActivities.push(
        {
          id: timeEntryActivity['id'],
          name: timeEntryActivity['name'],
        },
      );
    });

    // extract userId
    const userId = responseUserDetail.body['user']['id'];

    return res.send({
      user_id: userId,
      time_entry_activities: timeEntryActivities,
    });
  } catch (ex) {
    return res.sendStatus(503);
  }
});

/**
 * Gets Toggl Track workspaces to client
 */
router.get('/toggl_track_workspaces', authCommons.checkJwt, async (req, res) => {
  const togglTrackApiKey: string | undefined = req.query['api_key']?.toString();

  if (!togglTrackApiKey) {
    return res.sendStatus(400);
  }

  const responseMe: superagent.Response | number = await getTogglTrackUser(togglTrackApiKey);
  if (!responseMe || typeof responseMe === 'number') {
    let statusCode = 503;
    if (responseMe && responseMe !== 401) {
      statusCode = responseMe;
    } else if (responseMe && responseMe === 401) {
      statusCode = 400;
    }
    return res.sendStatus(statusCode);
  }

  const responseWorkspaces: superagent.Response | number = await getTogglTrackWorkspaces(togglTrackApiKey);
  if (!responseWorkspaces || typeof responseWorkspaces === 'number') {
    // on error, response with status from Toggl Track
    let statusCode = 503;
    if (responseWorkspaces && responseWorkspaces !== 401) {
      statusCode = responseWorkspaces;
    } else if (responseWorkspaces && responseWorkspaces === 401) {
      // do not send 401, it would lead to user logout on the client side due to error intercepting
      statusCode = 400;
    }

    return res.sendStatus(statusCode);
  }

  try {
    // extract workspaces
    const workspaces: Record<string, unknown>[] = [];
    responseWorkspaces.body.forEach((workspace: never) => {
      workspaces.push(
        {
          id: workspace['id'],
          name: workspace['name'],
        },
      );
    });

    // extract userId
    const userId = responseMe.body['id'];

    return res.send({
      user_id: userId,
      workspaces: workspaces,
    });
  } catch (ex) {
    return res.sendStatus(503);
  }
});


/*
* Checks if the connection to user jira is valid
* checks by using API Key, domain and user email
*/
router.get('/jira_issue_statuses', authCommons.checkJwt, async (req, res) => {
  // those 3 are filled by user in the client form
  const jiraApiKey: string | undefined = req.query['api_key']?.toString();
  let jiraDomain: string | undefined = req.query['domain']?.toString();
  const jiraUserEmail: string | undefined = req.query['user_email']?.toString();
  // should validate too...
  if (jiraApiKey && jiraDomain && jiraUserEmail) {
    jiraDomain = encodeURI(jiraDomain);

    const jiraResponse: superagent.Response | number = await getJiraIssueStatuses(jiraDomain, jiraApiKey, jiraUserEmail);
    if (!jiraResponse || typeof jiraResponse === 'number') {
      return res.sendStatus(jiraResponse ? jiraResponse : 503)
    } else {
      const statuses: IssueState[] = []
      jiraResponse.body.forEach((status: any) => {
        statuses.push(new IssueState(status.id, status.name))
      })
      return res.send(statuses);
    }
  } else {
    return res.sendStatus(400)
  }

});

router.get('/jira_projects', authCommons.checkJwt, async (req, res) => {
  const jiraApiKey: string | undefined = req.query['api_key']?.toString();
  let jiraDomain: string | undefined = req.query['domain']?.toString();
  const jiraUserEmail: string | undefined = req.query['user_email']?.toString();

  if (jiraApiKey && jiraDomain && jiraUserEmail) {
    const jiraProjectsResponse: superagent.Response | number = await getJiraProjects(jiraDomain, jiraApiKey, jiraUserEmail)
    const jiraIssueFieldsResponse: superagent.Response | number = await getJiraIssueFileds(jiraDomain, jiraApiKey, jiraUserEmail)
    if (!jiraProjectsResponse || typeof jiraProjectsResponse === 'number') {
      return res.sendStatus(jiraProjectsResponse ? jiraProjectsResponse : 503)
    } else if (!jiraIssueFieldsResponse || typeof jiraIssueFieldsResponse === 'number') {
      return res.sendStatus(jiraIssueFieldsResponse ? jiraIssueFieldsResponse : 503)
    } else {
      const projects: Project[] = []
      jiraProjectsResponse.body.forEach((project: any) => {
        projects.push(new Project(project.id, project.name))
      })
      const fields: CustomField[] = []
      jiraIssueFieldsResponse.body.forEach((field: any) => {
        if (field.custom === true)
          fields.push(new CustomField(field.id, field.name))
      })
      const response = {
        projects: projects,
        customFields: fields
      }
      return res.send(response);
    }
  } else {
    return res.sendStatus(400)
  }

})

router.get('/redmine_projects', authCommons.checkJwt, async (req, res) => {
  const redmineApiKey: string | undefined = req.query['api_key']?.toString();
  let redmineApiPoint: string | undefined = req.query['api_point']?.toString();
  // should validate too...
  if (!redmineApiKey || !redmineApiPoint) {
    return res.sendStatus(400);
  }

  // encode redmine api point
  redmineApiPoint = encodeURI(redmineApiPoint);

  const responseProjects: superagent.Response | number = await getRedmineProjects(redmineApiPoint, redmineApiKey);

  if (!responseProjects || typeof responseProjects === 'number') {
    // on error, response with status from Redmine
    let statusCode = 503;
    if (responseProjects && responseProjects !== 401) {
      statusCode = responseProjects;
    } else if (responseProjects && responseProjects === 401) {
      // do not send 401, it would lead to user logout on the client side due to error intercepting
      statusCode = 400;
    }

    return res.sendStatus(statusCode);
  }
  if (responseProjects.body.projects) {
    const projects: Project[] = []
    const custFields: CustomField[] = []
    responseProjects.body.projects.forEach((p: any) => {
      const custFieldsOfProject: CustomField[] = []
      p.custom_fields.forEach((c: any) => {
        const newCustField = new CustomField(c.id, c.name)
        custFieldsOfProject.push(newCustField)

        const found = custFields.find((f: any) => {
          return f.id === c.id
        })
        if (!found) {
          custFields.push(newCustField)
        }
      })
      projects.push(new Project(p.id, p.name, custFieldsOfProject, p.parent ? p.parent.id : null))
    })
    const response = {
      projects: projects,
      customFields: custFields
    }
    return res.send(response)
  } else {
    res.sendStatus(400)
  }
})


module.exports = router;