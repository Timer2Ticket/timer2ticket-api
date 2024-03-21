import { text } from 'body-parser';
import superagent from 'superagent';
export async function getTogglTrackUser(togglTrackApiKey: string): Promise<superagent.Response | number> {
  let responseMe: superagent.Response;
  try {
    responseMe = await superagent
      .get('https://api.track.toggl.com/api/v9/me')
      .auth(togglTrackApiKey, 'api_token');
  } catch (err: any) {
    return err.status;
  }
  return responseMe;
}

export async function getTogglTrackWorkspaces(togglTrackApiKey: string): Promise<superagent.Response | number> {
  let responseWorkspaces: superagent.Response;
  try {
    responseWorkspaces = await superagent
      .get('https://api.track.toggl.com/api/v9/me/workspaces')
      .auth(togglTrackApiKey, 'api_token');
  } catch (err: any) {
    return err.status;
  }
  return responseWorkspaces;
}

export async function createTogglTrackWebhook(togglTrackApiKey: string, workspaceId: number | string, urlCallback: string): Promise<superagent.Response | number> {
  let response
  try {
    response = await superagent
      .post(`https://api.track.toggl.com/webhooks/api/v1/subscriptions/${workspaceId}`)
      .auth(togglTrackApiKey, 'api_token')
      .send({
        url_callback: urlCallback,
        event_filters: [
          { entity: "time_entry", action: "created" },
          { entity: "time_entry", action: "updated" },
          { entity: "time_entry", action: "deleted" },
        ]
      })
  } catch (err: any) {
    return err.status
  }
  return response
}


export async function getExistingTogglTrackWebhooks(togglTrackApiKey: string, workspaceId: number | string): Promise<superagent.Response | number> {
  let response
  try {
    response = await superagent
      .get(`https://api.track.toggl.com/webhooks/api/v1/subscriptions/${workspaceId}`)
      .auth(togglTrackApiKey, 'api_token')
  } catch (err: any) {
    return err.status
  }
  return response
}


export async function getRedmineTimeEntryActivities(redmineApiPoint: string, redmineApiKey: string): Promise<superagent.Response | number> {
  // add last / if not provided by user
  redmineApiPoint = redmineApiPoint.endsWith('/')
    ? redmineApiPoint
    : `${redmineApiPoint}/`;
  // add https:// if not provided by user
  redmineApiPoint = (redmineApiPoint.startsWith('https://') || redmineApiPoint.startsWith('http://'))
    ? redmineApiPoint
    : `https://${redmineApiPoint}`;

  let responseTimeEntryActivities: superagent.Response;
  try {
    responseTimeEntryActivities = await superagent
      .get(`${redmineApiPoint}enumerations/time_entry_activities.json`)
      .accept('application/json')
      .type('application/json')
      .set('X-Redmine-API-Key', redmineApiKey);
  } catch (err: any) {
    return err.status;
  }
  return responseTimeEntryActivities;
}

export async function getRedmineProjects(redmineApiPoint: string, redmineApiKey: string): Promise<superagent.Response | number> {
  redmineApiPoint = redmineApiPoint.endsWith('/')
    ? redmineApiPoint
    : `${redmineApiPoint}/`;
  // add https:// if not provided by user
  redmineApiPoint = (redmineApiPoint.startsWith('https://') || redmineApiPoint.startsWith('http://'))
    ? redmineApiPoint
    : `https://${redmineApiPoint}`;

  let response: superagent.Response;
  try {
    response = await superagent
      .get(`${redmineApiPoint}projects.json`)
      .accept('application/json')
      .type('application/json')
      .set('X-Redmine-API-Key', redmineApiKey);
  } catch (err: any) {
    return err.status;
  }
  return response;
}

export async function getRedmineIssues(redmineApiPoint: string, redmineApiKey: string): Promise<superagent.Response | number> {
  redmineApiPoint = redmineApiPoint.endsWith('/')
    ? redmineApiPoint
    : `${redmineApiPoint}/`;
  // add https:// if not provided by user
  redmineApiPoint = (redmineApiPoint.startsWith('https://') || redmineApiPoint.startsWith('http://'))
    ? redmineApiPoint
    : `https://${redmineApiPoint}`;

  let response: superagent.Response;
  try {
    response = await superagent
      .get(`${redmineApiPoint}issues.json`)
      .accept('application/json')
      .type('application/json')
      .set('X-Redmine-API-Key', redmineApiKey);
  } catch (err: any) {
    return err.status;
  }
  return response;
}


export async function getRedmineUserDetail(redmineApiPoint: string, redmineApiKey: string): Promise<superagent.Response | number> {
  // add last / if not provided by user
  redmineApiPoint = redmineApiPoint.endsWith('/')
    ? redmineApiPoint
    : `${redmineApiPoint}/`;
  // add https:// if not provided by user
  redmineApiPoint = (redmineApiPoint.startsWith('https://') || redmineApiPoint.startsWith('http://'))
    ? redmineApiPoint
    : `https://${redmineApiPoint}`;

  let responseUserDetail;
  try {
    responseUserDetail = await superagent
      .get(`${redmineApiPoint}users/current.json`)
      .accept('application/json')
      .type('application/json')
      .set('X-Redmine-API-Key', redmineApiKey);
  } catch (err: any) {
    return err.status;
  }

  return responseUserDetail;
}


export async function checkJiraConnection(jiraDomain: string, jiraApiKey: string, jiraUserEmail: string): Promise<superagent.Response | number> {
  // add last / if not provided by user
  jiraDomain = jiraDomain.endsWith('/')
    ? jiraDomain
    : `${jiraDomain}/`;
  // add https:// if not provided by user
  jiraDomain = (jiraDomain.startsWith('https://') || jiraDomain.startsWith('http://'))
    ? jiraDomain
    : `https://${jiraDomain}`;

  const secret = Buffer.from(`${jiraUserEmail}:${jiraApiKey}`).toString("base64")

  try {
    const response = await superagent
      .get(`${jiraDomain}/rest/api/3/myself`)
      .accept('application/json')
      .set('Authorization', `Basic ${secret}`);
    return response
  } catch (err: any) {
    return err.status;
  }
}
export async function getJiraIssueStatuses(jiraDomain: string, jiraApiKey: string, jiraUserEmail: string): Promise<superagent.Response | number> {
  // add last / if not provided by user
  jiraDomain = jiraDomain.endsWith('/')
    ? jiraDomain
    : `${jiraDomain}/`;
  // add https:// if not provided by user
  jiraDomain = (jiraDomain.startsWith('https://') || jiraDomain.startsWith('http://'))
    ? jiraDomain
    : `https://${jiraDomain}`;

  const secret = Buffer.from(`${jiraUserEmail}:${jiraApiKey}`).toString("base64")

  try {
    const response = await superagent
      .get(`${jiraDomain}/rest/api/3/status`)
      .accept('application/json')
      .set('Authorization', `Basic ${secret}`);
    return response
  } catch (err: any) {
    return err.status;
  }
}

export async function getJiraProjects(jiraDomain: string, jiraApiKey: string, jiraUserEmail: string): Promise<superagent.Response | number> {
  jiraDomain = jiraDomain.endsWith('/')
    ? jiraDomain
    : `${jiraDomain}/`;
  // add https:// if not provided by user
  jiraDomain = (jiraDomain.startsWith('https://') || jiraDomain.startsWith('http://'))
    ? jiraDomain
    : `https://${jiraDomain}`;

  const secret = Buffer.from(`${jiraUserEmail}:${jiraApiKey}`).toString("base64")
  try {
    const response = await superagent
      .get(`${jiraDomain}/rest/api/3/project`)
      .accept('application/json')
      .set('Authorization', `Basic ${secret}`);
    return response
  } catch (err: any) {
    console.log(err)
    return err.status;
  }
}

export async function getJiraIssueFileds(jiraDomain: string, jiraApiKey: string, jiraUserEmail: string): Promise<superagent.Response | number> {
  jiraDomain = jiraDomain.endsWith('/')
    ? jiraDomain
    : `${jiraDomain}/`;
  // add https:// if not provided by user
  jiraDomain = (jiraDomain.startsWith('https://') || jiraDomain.startsWith('http://'))
    ? jiraDomain
    : `https://${jiraDomain}`;

  const secret = Buffer.from(`${jiraUserEmail}:${jiraApiKey}`).toString("base64")

  try {
    const response = await superagent
      .get(`${jiraDomain}/rest/api/3/field`)
      .accept('application/json')
      .set('Authorization', `Basic ${secret}`);
    return response
  } catch (err: any) {
    return err.status;
  }
}


export async function getJiraIssueById(jiraDomain: string, jiraApiKey: string, jiraUserEmail: string, issueId: number): Promise<superagent.Response | null> {
  jiraDomain = jiraDomain.endsWith('/')
    ? jiraDomain
    : `${jiraDomain}/`;
  // add https:// if not provided by user
  jiraDomain = (jiraDomain.startsWith('https://') || jiraDomain.startsWith('http://'))
    ? jiraDomain
    : `https://${jiraDomain}`;

  const secret = Buffer.from(`${jiraUserEmail}:${jiraApiKey}`).toString("base64")

  try {
    const response = await superagent
      .get(`${jiraDomain}/rest/api/3/issue/${issueId}`)
      .accept('application/json')
      .set('Authorization', `Basic ${secret}`);
    return response
  } catch (err: any) {
    return err.status;
  }
}
