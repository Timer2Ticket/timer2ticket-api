const ToolType = {
  REDMINE: {
    name: "Redmine",
    type: "Project",
    attributesFromClient: ["redmineApiKey", "redmineApiPoint", "selectedRedmineDefaultTimeEntryActivity", "selectedRedmineDefaultTimeEntryActivityName"]
  },
  TOGGL_TRACK: {
    name: "Toggl Track",
    type: "Time",
    attributesFromClient: ["togglTrackApiKey", "selectedTogglTrackWorkspace", "selectedTogglTrackWorkspaceName"]
  },
  JIRA: {
    name: "Jira",
    type: "Project",
    attributesFromClient: ["jiraApiKey", "JiraUserEmail", "jiraDomain"]
  },
};

export { ToolType };