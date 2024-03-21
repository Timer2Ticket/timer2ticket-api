import express from 'express';
import superagent from 'superagent';
import { authCommons } from '../shared/auth_commons';
import {
  checkJiraConnection,
  createTogglTrackWebhook,
  getExistingTogglTrackWebhooks,
  getJiraIssueFileds,
  getJiraIssueStatuses,
  getJiraProjects,
  getRedmineIssues,
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
import { type } from 'os';
import { Constants } from '../shared/constants';


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
  check if webhook exist
    if does, return 304
  else create new webhook for the connection
*/
router.post('/toggl_track_create_webhook', authCommons.checkJwt, async (req, res) => {
  console.log('create webhook request')
  const togglTrackApiKey: string | undefined = req.body['api_key']?.toString();
  const workspaceId: string | undefined = req.body['workspaceId']?.toString()
  const connectionId: string | undefined = req.body['connectionId']?.toString()

  if (!togglTrackApiKey || !workspaceId || !connectionId) {
    return res.sendStatus(400);
  }
  const callbackUrl: string = `https://b44b-2a02-8308-8182-a000-9c8d-dcb1-8ba5-349f.ngrok-free.app/api/v2/webhooks/toggl_track/${connectionId}`
  //check if exists
  const webhooksResponse = await getExistingTogglTrackWebhooks(togglTrackApiKey, workspaceId)
  if (!webhooksResponse || typeof webhooksResponse === 'number') {
    let statusCode = 503;
    if (webhooksResponse && webhooksResponse !== 401) {
      statusCode = webhooksResponse;
    } else if (webhooksResponse && webhooksResponse === 401) {
      // do not send 401, it would lead to user logout on the client side due to error intercepting
      statusCode = 400;
    }
    console.log('some error while fetching webhooks list: ', statusCode)
    return res.sendStatus(statusCode);
  }
  const webhookExists = webhooksResponse.body.find((wh: any) => {
    const whcallbackUrl = wh['url_callback']?.toString()
    if (!whcallbackUrl)
      return false
    else
      return whcallbackUrl === callbackUrl
  })
  if (webhookExists) {
    console.log('webhook already exists')
    return res.sendStatus(202)
  }

  //create new
  const response = await createTogglTrackWebhook(togglTrackApiKey, workspaceId, callbackUrl)
  if (!response || typeof response === 'number') {
    // on error, response with status from Toggl Track
    let statusCode = 503;
    if (response && response !== 401) {
      statusCode = response;
    } else if (response && response === 401) {
      // do not send 401, it would lead to user logout on the client side due to error intercepting
      statusCode = 400;
    }
    return res.sendStatus(statusCode);
  }
  //save password to DB
  return res.sendStatus(201)
})


/*
* Checks if the connection to user jira is valid
* checks by using API Key, domain and user email
*/
router.get('/check_jira_connection', authCommons.checkJwt, async (req, res) => {
  const jiraApiKey: string | undefined = req.query['api_key']?.toString();
  let jiraDomain: string | undefined = req.query['domain']?.toString();
  const jiraUserEmail: string | undefined = req.query['user_email']?.toString();
  // should validate too...
  if (jiraApiKey && jiraDomain && jiraUserEmail) {
    jiraDomain = encodeURI(jiraDomain);

    const jiraResponse: superagent.Response | number = await checkJiraConnection(jiraDomain, jiraApiKey, jiraUserEmail);
    if (!jiraResponse || typeof jiraResponse === 'number') {
      return res.sendStatus(jiraResponse ? jiraResponse : 503)
    } else {
      return res.send(jiraResponse.body.accountId);
    }
  } else {
    return res.sendStatus(400)
  }
})


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
        const newStatus = new IssueState(status.statusCategory.id, status.statusCategory.name)
        const found = statuses.find((st: IssueState) => {
          return st.id === newStatus.id
        })
        if (!found) {
          statuses.push(newStatus)
        }
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
        if (field.custom === true) {
          const newField = new CustomField(field.id, field.name)
          fields.push(newField)
          if (!field.scope) {
            projects.forEach(project => {
              project.customFields.push(newField)
            })
          } else {
            if (field.scope.project && field.scope.project.id) {
              const project = projects.find(project => {
                return project.id == field.scope.project.id
              })
              if (project)
                project.customFields.push(newField)
            }
          }
        }
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
  const responseIssues: superagent.Response | number = await getRedmineIssues(redmineApiPoint, redmineApiKey)

  if (!responseProjects || typeof responseProjects === 'number' || !responseIssues || typeof responseIssues === 'number') {
    // on error, response with status from Redmine
    let statusCode = 503;
    if (responseProjects && responseProjects !== 401 && typeof responseProjects === 'number') {
      statusCode = responseProjects;
    } else if (responseIssues && responseIssues !== 401 && typeof responseIssues === 'number') {
      statusCode = responseIssues;
    } else if ((responseProjects && responseProjects === 401) || (responseIssues && responseIssues === 401)) {
      // do not send 401, it would lead to user logout on the client side due to error intercepting
      statusCode = 400;
    }
    return res.sendStatus(statusCode);
  }
  if (responseProjects.body.projects && responseIssues.body.issues) {
    const projects: Project[] = []
    const custFields: CustomField[] = []
    responseProjects.body.projects.forEach((project: any) => {
      projects.push(new Project(project.id, project.name, [], project.parent ? project.parent.id : null))
    })
    responseIssues.body.issues.forEach((issue: any) => {
      const custFieldsOfProject: CustomField[] = []
      issue.custom_fields.forEach((c: any) => {
        const newCustField = new CustomField(c.id, c.name)
        const foundGlobaly = custFields.find((f: any) => {
          return f.id === c.id
        })
        if (!foundGlobaly) {
          custFields.push(newCustField)
        }
        projects.forEach((project: Project) => {
          const found = project.customFields.find((c: CustomField) => {
            return c.id === newCustField.id
          })
          if (!found && project.id === issue.project.id) {
            project.customFields.push(newCustField)
          }
        })
      })
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