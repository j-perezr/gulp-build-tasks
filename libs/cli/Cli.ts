import * as program from "commander";
import {Api} from "../api/Api";
program
    .version('0.0.1')
    .option('-p, --port <n>', 'Port for service', parseInt)
    .option('-l, --disable-live-reload', 'Disable live reload. Default enabled')
    .option('-d, --base-dir <val>', 'Base dir for the server. Default ./')
    .option('-P, --production', 'Dist for poroduction')
    .option('-n, --no-sourcemap', 'Don not generate sourcemaps').parse(process.argv);
new Api({}).loadTasks().run();