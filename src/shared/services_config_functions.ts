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

  let response
  try {
    response = await superagent
      .get(`${jiraDomain}`)
      .accept('text/html')
      .set('Autorization', `Basic ${secret}`);
  } catch (err: any) {
    return err.status;
  }

  return response
}