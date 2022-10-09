## 📓➡️📔 euclifora

Migrate your Youtrack tickets to the JIRA easily 👍

```shell
$ euclifora

Usage: euclifora [options] [command]


     ____ __  __ _____ __    ____ ____ ____   ___   ___ 
    / __// / / // ___// /   /  _// __// __ \ / _ \ / _ |
   / _/ / /_/ // /__ / /__ _/ / / _/ / /_/ // , _// __ |
  /___/ \____/ \___//____//___//_/   \____//_/|_|/_/ |_|
                                                        


Options:
  -h, --help             display help for command

Commands:
  get-data-for-mappings  Displays all data from both trackers necessary for mappings in the configuration file
  migrate                Migrate YouTrack issues to the Jira
  projects               Get YouTrack and Jira users and show in tables one-by-one
  users                  Get YouTrack and Jira users and show in tables one-by-one
  issue-types            Get YouTrack and Jira issue types and show in tables one-by-one
  issue-link-types       Get YouTrack and Jira issue link types and show in tables one-by-one
  help [command]         display help for command
```

## How to

1. Clone this project to the desired machine to run it later.
2. Create a `default.json` from `config/default.json.sample`
3. Fill at least `url/domain` and `token` data into the corresponding sections `youtrack` and `jira` sections
4. In case of any concerns about mapping values use `euclifora get-data-for-mappings` to get available valaues
5. After completing configuration run the script `euclifora migrate`

### TODOs

- **_Add more details to this README_**
- Add a "--dry" option to the `migrate` command
- Improve error handling
  - Memorize and log issues failed to migrate
- Make a simple SPA to allow non-programmers to use the migration tool
- Remove string workaround with `replaceAll` method