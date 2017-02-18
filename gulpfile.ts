/*
 gulpfile.js
 ===========
 Rather than manage one giant configuration file responsible
 for creating multiple tasks, each task has been broken out into
 its own file in gulp/tasks. Any files in that directory get
 automatically required below.
 To add a new task, simply add a new task file that directory.
 gulp/tasks/default.js specifies the default set of tasks to run
 when you run `gulp`.
 */
const program = require('commander');

program
    .version('0.0.1')
    .option('-p, --port <n>', 'Port for service', parseInt)
    .option('-l, --disable-live-reload', 'Disable live reload. Default enabled')
    .option('-d, --base-dir <val>', 'Base dir for the server. Default ./')
    .option('-P, --production', 'Dist for poroduction')
    .option('-n, --no-sourcemap', 'Don not generate sourcemaps').parse(process.argv);
let requireDir = require('require-dir');

requireDir('./tasks', {recurse: true});
