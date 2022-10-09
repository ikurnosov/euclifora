import { migrateYouTrackToJira } from './migrators/youTrackToJira.js';
import { getUsers, getProjects, getIssueTypes as getYTIssueTypes, getIssueLinkTypes as getYTIssueLinkTypes } from './providers/yt.js';
import { getIssueLinkTypes, getIssueTypes, getUsers as getJiraUsers, getProjects as getJiraProjects} from './providers/jira.js';
import {logDivider, logDividerWrapped} from './utils.js';

export const migrateCommand = async () => {
    console.log('Starting migration...');
    await migrateYouTrackToJira();
    console.log('Done!');
};

export const showYTUsersCommand = async () => {
    const result = await getUsers();
    console.table(result);
};

export const showYTProjectsCommand = async () => {
    const result = await getProjects();
    console.table(result);
};

export const showYTIssueLinkTypesCommand = async () => {
    const result = await getYTIssueLinkTypes();
    console.table(result);
};

export const showJiraIssueTypesCommand = async () => {
    const result = await getIssueTypes();
    const reducedResult = result.reduce((acc, val) => {
        const { id, name, description } = val;
        acc[id] = { name, description };

        return acc;
    }, {});
    console.table(reducedResult);
};

export const showJiraIssueLinkTypesCommand = async () => {
    const result = await getIssueLinkTypes();
    console.table(result.issueLinkTypes);
};

export const showJiraUsersCommand = async () => {
    const result = await getJiraUsers();
    const reducedResult = result.reduce((acc, val, index) => {
        const { accountId, emailAddress, displayName, active } = val;
        acc[index + 1] = { accountId, emailAddress, displayName, active };

        return acc;
    }, {});
    console.table(reducedResult);
};

export const showJiraProjectsCommand = async () => {
    const result = await getJiraProjects();
    const reducedResult = result.values.reduce((acc, val, index) => {
        const { id, key, name } = val;
        acc[index] = { key, id, name };

        return acc;
    }, {});
    console.table(reducedResult);
};

export const showYTIssueTypesCommand = async () => {
    const result = await getYTIssueTypes();
    const reducedResult = result.reduce((acc, val) => {
        acc.push(val.name);
        return acc;
    }, []);

    console.table(reducedResult);
};

export const showAllTrackersDataForConfCommand = async () => {
    logDivider();
    console.log('|********* PROJECTS *********|');
    logDivider();
    console.log('Show YouTrack projects..');
    await showYTProjectsCommand();
    logDividerWrapped();
    console.log('Show Jira projects..');
    await showJiraProjectsCommand();

    console.log(' ');
    logDivider();
    console.log('|*********  USERS  *********|');
    logDivider();
    console.log(' ');
    console.log('Show YouTrack users..');
    await showYTUsersCommand();
    logDividerWrapped();
    console.log('Show Jira users..');
    await showJiraUsersCommand();

    console.log(' ');
    logDivider();
    console.log('|****** ISSUE TYPES ******|');
    logDivider();
    console.log(' ');
    console.log('Show YouTrack issue types..');
    await showYTIssueTypesCommand();
    logDividerWrapped();
    console.log('Show Jira issue types..');
    await showJiraIssueTypesCommand();

    console.log(' ');
    logDivider();
    console.log('|**** ISSUE TYPE LINKS ****|');
    logDivider();
    console.log(' ');
    console.log('Show YouTrack issue link types..');
    await showYTUsersCommand();
    logDividerWrapped();
    console.log('Show Jira issue link types..');
    await showJiraUsersCommand();
};