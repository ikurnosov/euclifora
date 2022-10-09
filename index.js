#!/usr/bin/env node
import { Command } from 'commander';

import * as commands from './commands.js';
import {logDivider, logDividerWrapped} from './utils.js';
import {showAllTrackersDataForConfCommand} from './commands.js';

const main = () => {
    const program = new Command();
    program
        .description('\n' +
            '     ____ __  __ _____ __    ____ ____ ____   ___   ___ \n' +
            '    / __// / / // ___// /   /  _// __// __ \\ / _ \\ / _ |\n' +
            '   / _/ / /_/ // /__ / /__ _/ / / _/ / /_/ // , _// __ |\n' +
            '  /___/ \\____/ \\___//____//___//_/   \\____//_/|_|/_/ |_|\n' +
            '                                                        \n');

    program
        .command('get-data-for-mappings')
        .description('Displays all data from both trackers necessary for mappings in the configuration file')
        .action(showAllTrackersDataForConfCommand);

    program
        .command('migrate')
        .description('Migrate YouTrack issues to the Jira')
        .action(commands.migrateCommand);

    const projectsCommand = program.command('projects');
    projectsCommand
        .description('Get YouTrack and Jira users and show in tables one-by-one')
        .action(async () => {
            console.log(' ');
            console.log('Show YouTrack projects..');
            await commands.showYTProjectsCommand();
            logDividerWrapped();
            console.log('Show Jira projects..');
            await commands.showJiraProjectsCommand();
        });
    projectsCommand
        .command('yt')
        .description('Get YouTrack projects available by the provided user token')
        .action(commands.showYTProjectsCommand);
    projectsCommand
        .command('jira')
        .description('Get Jira projects available by the provided user token')
        .action(commands.showJiraProjectsCommand);

    const usersCommand = program.command('users');
    usersCommand
        .description('Get YouTrack and Jira users and show in tables one-by-one')
        .action(async () => {
            console.log(' ');
            console.log('Show YouTrack users..');
            await commands.showYTUsersCommand();
            logDividerWrapped();
            console.log('Show Jira users..');
            await commands.showJiraUsersCommand();
        });
    usersCommand
        .command('yt')
        .description('Get YouTrack users available by the provided user token')
        .action(commands.showYTUsersCommand);
    usersCommand
        .command('jira')
        .description('Get Jira users assignable to the specified Jira project')
        .action(commands.showJiraUsersCommand);

    const issueTypesCommand = program.command('issue-types');
    issueTypesCommand
        .description('Get YouTrack and Jira issue types and show in tables one-by-one')
        .action(async () => {
            console.log(' ');
            console.log('Show YouTrack issue types..');
            await commands.showYTIssueTypesCommand();
            logDividerWrapped();
            console.log('Show Jira issue types..');
            await commands.showJiraIssueTypesCommand();
        });
    issueTypesCommand
        .command('yt')
        .description('Get all YouTrack issue types for the user')
        .action(commands.showYTIssueTypesCommand);
    issueTypesCommand
        .command('jira')
        .description('Get all Jira issue types for the user')
        .action(commands.showJiraIssueTypesCommand);

    const issueLinkTypes = program.command('issue-link-types');
    issueLinkTypes
        .description('Get YouTrack and Jira issue link types and show in tables one-by-one')
        .action(async () => {
            console.log(' ');
            console.log('Show YouTrack issue link types..');
            await commands.showYTUsersCommand();
            logDividerWrapped();
            console.log('Show Jira issue link types..');
            await commands.showJiraUsersCommand();
        });
    issueLinkTypes
        .command('yt')
        .description('Get all YouTrack issue link types for the user')
        .action(commands.showYTIssueLinkTypesCommand);
    issueLinkTypes
        .command('jira')
        .description('Get all Jira issue link types for the user')
        .action(commands.showJiraIssueLinkTypesCommand);

    program.showHelpAfterError();

    return program.parseAsync(process.argv);
};

try {
    await main();
} catch (error) {
    process.exit(1);
}
