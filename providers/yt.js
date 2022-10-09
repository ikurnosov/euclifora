import axios from 'axios';
import config from 'config';

export async function getData(entity, paramsString) {
    try {
        const ytUrl = `${config.youtrack.url}/api/${entity}?${paramsString}`;
        console.log(`Pulling ${entity} with URL`, ytUrl);
        const response = await axios.get(ytUrl, {
            headers: {
                'Authorization': 'Bearer ' + config.youtrack.token
            }
        });

        return response.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export function getIssues(offset, limit) {
    const fieldsToPull = [
        'id',
        'created',
        'updated',
        'project(id)',
        'idReadable',
        'summary',
        'description',
        'reporter(login)',
        'comments(author(login),text,deleted,created,attachments(author,name,removed,url,size,mimeType))',
        'tags(name)',
        'links(linkType(directed,name,sourceToTarget,targetToSource),direction,issues(id))',
        'attachments(author,name,removed,url,size,mimeType)',
        'subtasks(linkType,direction,issues(id))',
        'parent(linkType,direction,issues(id))',
        'customFields(projectCustomField(field(name)),value(name,fullName,login,text,minutes))',
        'watchers(issueWatchers(user(login)))'
    ];
    const ytIssuesUrlParams = `$top=${limit}${offset ? '&$skip=' + offset : ''}&fields=${fieldsToPull.join(',')}&query=created:%202020-05%20..%20Today%20sort%20by:%20created%20asc%20`;
    const entityPlural = 'issues';

    return getData(entityPlural, ytIssuesUrlParams);
}

export function getUsers() {
    const entityPlural = 'users';

    return getData(entityPlural, 'fields=login');
}

export function getIssueURL(issueReadableId) {
    return `${config.youtrack.url}/youtrack/issue/${issueReadableId}`;
}

export function getIssueLinkTypes() {
    const entityPlural = 'issueLinkTypes';

    return getData(entityPlural, 'fields=name,sourceToTarget,targetToSource');
}

export async function getProjects() {
    try {
        const ytUrl = `${config.youtrack.url}/api/admin/projects?fields=id,name,shortName`;
        const response = await axios.get(ytUrl, {
            headers: {
                'Authorization': 'Bearer ' + config.youtrack.token
            }
        });

        return response.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function getIssuesCount() {
    try {
        const ytUrl = `${config.youtrack.url}/api/admin/projects/${config.youtrack.project}?fields=issues`;
        const response = await axios.get(ytUrl, {
            headers: {
                'Authorization': 'Bearer ' + config.youtrack.token
            }
        });

        return response.data.issues.length;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function getIssueTypes() {
    try {
        const getCustomFieldsURL = `${config.youtrack.url}/api/admin/customFieldSettings/customFields?fields=name,fieldDefaults(bundle(values(name)))`;
        const { data: customFields } = await axios.get(getCustomFieldsURL, {
            headers: {
                'Authorization': 'Bearer ' + config.youtrack.token
            }
        });

        const { fieldDefaults: { bundle: { values } } } = customFields.find(field => field.name === 'Type');

        return values;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
