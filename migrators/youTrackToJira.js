import config from 'config';

import { resolveTicketStatus } from '../customizable/resolveTicketStatus.mjs';
import * as yt from '../providers/yt.js';
import * as jira from '../providers/jira.js';

const MAX_BODY_LENGTH = config.maxBodyLength;

function processCustomFields(customFields) {
    const customFieldsReduced = {};
    const issueLabels = [];

    for (let field of customFields) {
        let fieldName = field.projectCustomField.field.name;
        if (!fieldName || !field.value) continue;

        if (fieldName === 'QA state') {
            fieldName = "QaState";
        }

        let fieldValue = field.value.login || field.value.text || field.value.name || field.value.minutes;
        if (fieldValue && config.app.fieldsToSaveInLabels.includes(fieldName)) {
            issueLabels.push(`${fieldName}:${fieldValue}`);
        }
        const key = fieldName.toLowerCase().split(" ").join("_");
        customFieldsReduced[key] = fieldValue;
    }

    return { customFieldsReduced, issueLabels };
}

async function addComments(comments, jiraIssueId) {
    const commentAttachments = [];
    let commentCounter = 0;

    console.log('Adding comments to Issue ID: ', jiraIssueId);
    for (let comment of comments) {
        if (comment.deleted) continue;

        const authorLine = `Comment was added by ${comment.author.login}`;
        const createdLine = ` on ${(new Date(comment.created)).toUTCString()}`;
        let commentText = authorLine + createdLine + '\n\n' + comment.text;

        for (let commentAttachment of comment.attachments) {
            if (commentAttachment.removed || !commentAttachment.url) continue;

            if (commentAttachment.size < MAX_BODY_LENGTH) {
                commentAttachments.push(commentAttachment);
            } else {
                commentText += '\n\n' + `Attachment YT URL: ${config.youtrack.url}${commentAttachment.url}`;
            }
        }

        const commentBody = jira.getCommentSkeleton(commentText);

        await jira.addComment(jiraIssueId, commentBody);
        commentCounter++;
    }
    console.log(`Successfully added ${commentCounter} comments to Issue ID: `, jiraIssueId);

    return commentAttachments;
}

async function linkIssues(links, issuesMap, jiraIssueId) {
    console.log('Linking issues...');
    for (let linkCat of links) {
        const linkTypeMappingFound = config.mappings.linkTypes[linkCat.linkType.name];

        if(linkTypeMappingFound && linkCat.issues.length > 0) {
            for (let relation of linkCat.issues) {
                const issueMappedId = issuesMap[relation.id];
                if (!issueMappedId) continue;

                let linkSkeleton = null;
                if (linkCat.direction === 'BOTH' || linkCat.direction === 'OUTWARD') {
                    linkSkeleton = jira.getIssueLinkSkeleton(
                        jiraIssueId.toString(),
                        issueMappedId.toString(),
                        linkTypeMappingFound
                    );
                } else {
                    linkSkeleton = jira.getIssueLinkSkeleton(
                        issueMappedId.toString(),
                        jiraIssueId.toString(),
                        linkTypeMappingFound
                    );
                }
                await jira.addIssueLink(linkSkeleton);
            }
        }
    }
    console.log('Finished linking issues');
}

async function addWatchers(issueWatchers, jiraIssueId) {
    console.log('Adding issue watchers...');
    let watcherCounter = 0;
    for (let watcher of issueWatchers) {
        const watcherId = config.mappings.users[watcher.user.login];
        if (watcherId) {
            await jira.addIssueWatcher(jiraIssueId, watcherId);
            watcherCounter++;
        }
    }
    console.log(`Added ${watcherCounter} issue watchers`);
}

export async function migrateYouTrackToJira() {
    console.log('Initializing migration of YouTrack issues data to Jira...');

    const ytIssuesCount = await yt.getIssuesCount();
    console.log('Found issues: ', ytIssuesCount);
    const chunkSize = config.app.chunkSize;
    const numberOfChunks = Math.ceil(ytIssuesCount / chunkSize);
    console.log('Expected number of chunks: ', numberOfChunks);
    const issuesMap = {};

    for (let x = 0; x < numberOfChunks; ++x) {
        console.log('Starting chunk #', x);

        const offset = chunkSize * x;
        const ytIssues = await yt.getIssues(offset, chunkSize);

        for (let issue of ytIssues) {
            const issueId = issue.id;
            const ytIssueLink = yt.getIssueURL(issue.idReadable);

            const createdOn = `Created on ${(new Date(issue.created)).toUTCString()}\n`;
            const lastUpdatedOn = `Last updated on ${(new Date(issue.updated)).toUTCString()}\n`;

            let issueAttachments = [];
            let issueDescription = createdOn + lastUpdatedOn + issue.description;

            const { customFieldsReduced, issueLabels } = processCustomFields(issue.customFields);

            // sort out attachments
            for (let attachment of issue.attachments) {
                if (attachment.removed || !attachment.url) continue;

                if (attachment.size < MAX_BODY_LENGTH) {
                    issueAttachments.push(attachment);
                } else {
                    issueDescription += '\n' + `Attachment YT URL: ${config.youtrack.url}${attachment.url}`;
                }
            }

            const issueSkeleton = jira.getIssueSkeleton(issue.summary, ytIssueLink + '\n\n' + issueDescription);

            // set user-related data
            const defaultUser = config.app.defaultUser;
            issueSkeleton.fields.assignee.id = config.mappings.users[customFieldsReduced['assignee']] || defaultUser;
            issueSkeleton.fields.reporter.id = config.mappings.users[issue.reporter.login] || defaultUser;

            // set specific issue mappings from custom fields
            const defaultPriority = config.app.defaultJiraIssuePriority;
            issueSkeleton.fields.issuetype = {"id": config.mappings.types[customFieldsReduced.type]};
            issueSkeleton.fields.priority = {"id": config.mappings.types[customFieldsReduced.priority] || defaultPriority};

            if (customFieldsReduced.estimation && config.app.timeTrackingScreenEnabled) {
                issueSkeleton.fields.timetracking = {
                    "remainingEstimate": customFieldsReduced.estimation + "m",
                    "originalEstimate": customFieldsReduced.estimation + "m"
                };
            }

            // finalize labels set
            for (let tag of issue.tags) {
                issueLabels.push(tag.name);
            }
            issueLabels.push(issue.idReadable);
            issueSkeleton.fields.labels = issueLabels.map(label => label.split(" ").join("_")); // replaceAll workaround

            console.log('Prepared data to create a new issue', issueSkeleton);

            const jiraIssueId = await jira.addIssue(issueSkeleton);
            issuesMap[issueId] = jiraIssueId;
            console.log('Created Jira Issue ID: ', jiraIssueId);

            const commentAttachments = await addComments(issue.comments, jiraIssueId);
            issueAttachments = [...issueAttachments, ...commentAttachments];

            console.log('Uploading related attachments');
            for (let contentToPush of issueAttachments) {
                await jira.addIssueAttachment(jiraIssueId, contentToPush);
            }
            console.log('Finished the upload of related attachments');

            await linkIssues(issue.links, issuesMap, jiraIssueId);

            // set transition to the correct status
            const transitionId = resolveTicketStatus(customFieldsReduced.state, customFieldsReduced.qastate);
            await jira.postIssueTransition(jiraIssueId, transitionId);

            if (issue.watchers.issueWatchers) {
                await addWatchers(issue.watchers.issueWatchers, jiraIssueId);
            }

            console.log('Finished YT issue migration: ', issue.idReadable);
        }

        console.log('Finished chunk #', x);
    }
}