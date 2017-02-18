import {ITaskOptions, BaseTask} from "../BaseTask";
import * as gulpPug from "gulp-pug";
import * as extend from "extend";
export interface IPugTaskOptions extends ITaskOptions {
    pug?: any;//see https://pugjs.org/api/reference.html#options
}
export class PugTask extends BaseTask {
    //extend from defaults of BaseTask
    protected static readonly DEFAULTS: IPugTaskOptions = extend(
        true, {}, BaseTask.DEFAULTS, {
            compileAll: true,
            sourcemaps: false,
            pug: {
                pretty: true
            }
        }
    );
    protected _options: IPugTaskOptions;
    protected _name = "Pug";
    protected _gulpPug = gulpPug;

    constructor(options: IPugTaskOptions) {
        super(options);
    }

    protected _filterPartials(file) {
        return !(/^_/.test(file.basename));
    }

    protected _applyCompilePlugin(stream: any, file) {
        return stream.pipe(this._gulpFilter(this._filterPartials)).pipe(this._gulpPug(this._options.pug));
    }

    protected _getDefaults(): any {
        return PugTask.DEFAULTS;
    }

    public static registerTasks(gulp, taskInstance?: PugTask) {
        taskInstance = taskInstance || new PugTask(
                {
                    files: "**/*.pug",
                    shutup: PugTask.SHUT_UP.success
                }
            );
        super.registerTasks(gulp, taskInstance);
    }
}
