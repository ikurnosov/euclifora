import axios from 'axios';
import config from 'config';
import FormData from 'form-data';
import * as fs from 'fs';

const CUSTOM_JIRA_API_3_URL = `https://${config.jira.domain}.atlassian.net/rest/api/3`;
const MAX_BODY_LENGTH = config.app.maxBodyLength;

async function downloadFile(url, path) {
    console.log('Downloading file from URL: ', url);

    const writer = fs.createWriteStream(path);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    });
}

export async function getIssueLinkTypes() {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issueLinkType`;
        console.log(`Pulling JIRA issueLinkType with URL`, jiraUrl);
        const response = await axios.get(jiraUrl, {
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export function getIssueSkeleton(summary, description) {
    return {
        "fields": {
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "text": description,
                                "type": "text"
                            }
                        ]
                    }
                ]
            },
            "reporter": {
                "id": config.app.defaultUser
            },
            "priority": {
                "id": "3"
            },
            "labels": [],
            "assignee": {
                "id": config.app.defaultUser
            },
            "project": {
                "key": config.jira.project
            }
        }
    };
}

export function getCommentSkeleton(text) {
    return {
        "body": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "text": text,
                            "type": "text"
                        }
                    ]
                }
            ]
        }
    };
}

export function getIssueLinkSkeleton(outwardIssueId, inwardIssueId, type) {
    return {
        "outwardIssue": {
            "id": outwardIssueId
        },
        "inwardIssue": {
            "id": inwardIssueId
        },
        "type": {
            "name": type
        }
    };
}

export async function addComment(jiraIssueId, commentBody) {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issue/${jiraIssueId}/comment`;
        console.log(`Adding comment to the issue with URL`, jiraUrl);
        const response = await axios.post(jiraUrl, commentBody,{
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Atlassian-Token': 'no-check'
            }
        });

        console.log('Successfully added comment');
        console.debug(response.data);

        return response.data.id;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function addIssue(issueSkeleton) {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issue`;
        console.log(`Creating issue with URL`, jiraUrl);
        const response = await axios.post(jiraUrl, issueSkeleton,{
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Atlassian-Token': 'no-check'
            }
        });

        console.log('Successfully created issue', response.data);

        return response.data.id;
    } catch (err) {
        console.table(err.response.data.errors);
        throw err;
    }
}

export async function addIssueLink(linkSkeleton) {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issueLink`;
        console.log(`Creating issue link with URL`, jiraUrl);
        const response = await axios.post(jiraUrl, linkSkeleton,{
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Atlassian-Token': 'no-check'
            }
        });

        console.log('Successfully created issue link');
        console.debug(response.data);

        return response.data.id;
    } catch (err) {
        console.table(err.response.data.errors);
        console.table(err.response.data.errorMessages);
        throw err;
    }
}

export async function postIssueTransition(jiraIssueId, transition) {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issue/${jiraIssueId}/transitions`;
        console.log(`Posting issue transition with URL`, jiraUrl);

        const { data } = await axios.get(jiraUrl,{
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Atlassian-Token': 'no-check'
            }
        });
        const availableTransitions = data.transitions;

        console.debug('The following transitions are available: ', availableTransitions);

        const transitionFound = availableTransitions.find(tr => tr.name === transition);
        if (!transitionFound) {
            console.warn('Unable to transition issue #', jiraIssueId);
            return;
        }

        const bodyData = {
            transition: {
                id: transitionFound.id
            }
        };
        const response = await axios({
            url: jiraUrl,
            method: 'post',
            data: JSON.stringify(bodyData),
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Atlassian-Token': 'no-check'
            }
        });

        console.log('Successfully posted issue transition');
        console.debug(response);

        return response.data;
    } catch (err) {
        if (response.data && response.data.errorMessages) {
            console.error(response.data.errorMessages);
        }
    }
}

export async function addIssueAttachment(jiraIssueId, attachment) {
    const filename = `./temp/${attachment.name}`;
    await downloadFile(config.youtrack.url + attachment.url, filename);

    const form = new FormData();
    form.append(
        'file',
        fs.createReadStream(filename),
        {
            filename: attachment.name,
            knownLength: attachment.size,
            contentType: attachment.mimeType
        }
    );

    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issue/${jiraIssueId}/attachments`;
        console.log(`Uploading attachment to the issue with URL`, jiraUrl);
        const response = await axios({
            method: 'post',
            url: jiraUrl,
            data: form,
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'X-Atlassian-Token': 'no-check'
            },
            maxContentLength: MAX_BODY_LENGTH,
            maxBodyLength: MAX_BODY_LENGTH
        });

        console.log('Successfully uploaded the attachment!');
        console.debug(response.data);

        // cleanup
        fs.unlinkSync(filename);

        return true;
    } catch (err) {
        console.error('Failed to upload the attachment', err);
    }
}

export async function addIssueWatcher(jiraIssueId, watcherId) {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issue/${jiraIssueId}/watchers`;
        console.log(`Adding issue watcher with URL`, jiraUrl);
        const response = await axios.post(jiraUrl, `"${watcherId}"`,{
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Atlassian-Token': 'no-check'
            }
        });

        console.log('Successfully added issue watcher');
        console.debug(response.data);

        return true;
    } catch (err) {
        console.error(err);
    }
}

export async function getIssueTypes() {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/issuetype`;
        console.log(`Pulling JIRA issuetype with URL`, jiraUrl);
        const response = await axios.get(jiraUrl, {
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function getUsers() {
    try {
        const projectKey = config.jira.project;
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/user/assignable/multiProjectSearch?projectKeys=${projectKey}`;
        console.log(`Pulling JIRA issuetype with URL`, jiraUrl);
        const response = await axios.get(jiraUrl, {
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function getProjects() {
    try {
        const jiraUrl = `${CUSTOM_JIRA_API_3_URL}/project/search`;
        console.log(`Pulling JIRA issuetype with URL`, jiraUrl);
        const response = await axios.get(jiraUrl, {
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${config.jira.user}:${config.jira.token}`
                ).toString('base64')}`,
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
