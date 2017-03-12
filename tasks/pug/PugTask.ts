import {ITaskOptions, BaseTask} from "../BaseTask";
import * as gulpPug from "gulp-pug";
import * as extend from "extend";
import * as gulpChange from 'gulp-change';
import * as jspm from "jspm";
import * as q from "q";
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
                pretty: true,
                basedir: process.cwd()
            }
        }
    );
    protected _options: IPugTaskOptions;
    protected _name = "Pug";
    protected _gulpPug = gulpPug;
    protected _gulpChange = gulpChange;
    protected _q = q;
    protected _jspm = jspm;
    protected _jspmRegex = new RegExp(/include\s+jspm:[^\n]*/gm);
    protected _executionFolder = process.cwd().replace(/\\/g,"/");
    constructor(options: IPugTaskOptions) {
        super(options);
        this._options.notify.success.icon = this._path.resolve(__dirname,"assets/notify.png");
        this._options.notify.error.icon = this._path.resolve(__dirname,"assets/notify.png");
    }
    protected _onJSPMNormalized(obj,normalized){
        normalized = normalized.replace("file:///","").replace(this._executionFolder,"").replace(".pug.js",".pug");
        obj.contentReference.content = obj.contentReference.content.replace(obj.result,obj.parts[0]+" "+normalized);
        obj.defer.resolve();
    }
    protected _resolveJSPM(content,done){
        let promises = [],
            contentReference = {
                content:content
            };
        if(this._jspmRegex.test(content)){
            let results = content.match(this._jspmRegex);
            for (let result of results) {
                let parts = result.split("jspm:"),
                    defer = this._q.defer();
                if(parts.length > 1) {
                    parts[1] = parts[1].trim();
                    this._jspm.normalize(parts[1]).then(this._onJSPMNormalized.bind(this,
                                                                                    {
                                                                                        defer: defer,
                                                                                        result:result,
                                                                                        parts: parts,
                                                                                        contentReference: contentReference
                                                                                    }));
                    promises.push(defer.promise);
                }
            }
            this._q.all(promises).then(()=>{
                done(null,contentReference.content);
            });
        }else{

        }
    }
    protected _filterPartials(file) {
        return !(/^_/.test(file.basename));
    }

    protected _applyCompilePlugin(stream: any, file) {
        return stream.pipe(this._gulpChange(this._resolveJSPM.bind(this))).pipe(this._gulpFilter(this._filterPartials)).pipe(this._gulpPug(this._options.pug));
    }

    protected _getDefaults(): any {
        return PugTask.DEFAULTS;
    }

    public static registerTasks(gulp, taskInstance?: PugTask) {
        taskInstance = taskInstance || new PugTask(
                {
                    files: "**/*.pug"
                }
            );
        super.registerTasks(gulp, taskInstance);
    }
}
