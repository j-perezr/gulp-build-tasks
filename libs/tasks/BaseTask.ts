import * as gulp from "gulp";
import * as extend from "extend";
import * as path from "path";
import * as watch from "gulp-watch";
import * as Vinyl from "vinyl";
import * as vfs from "vinyl-fs";
import * as gulpFilter from "gulp-filter";
import * as gulpDebug from "gulp-debug";
import * as gulpNotify from "gulp-notify";
import * as gulpPlumber from "gulp-plumber";
import * as gutil from "gulp-util";
import {Logger} from "../Logger";
/**
 * Options for process
 */
export interface IProcessParams {
    fileChanged?: Vinyl;
    filesToProcess?: string | string[]
}
export enum PACKAGE_MANAGERS{
    bower,
    npm,
    jspm
}
export interface ITaskExcludePackageManagers{
    bower?:boolean;
    npm?:boolean;
    jspm?:boolean;
}

export interface IRegisterTaskOptions{
    taskClass:any;
    taskInstance?:BaseTask;
}
/**
 * options for vinyl-fs
 */
export interface ITaskDestOptions {
    path: string;
    options?: any;//show https://github.com/gulpjs/vinyl-fs#destfolder-options
}
export interface INotifyOptions {
    title?: string;
    message?: string;
    shutUp?: boolean;
    timeout?: number;
    sound?: boolean;
    wait?: boolean;
    onLast?: boolean;
    icon?: string;
}
/**
 * Options for gulp-notify
 */
export interface ITaskNotifyOptions {
    success?: INotifyOptions,
    error?: INotifyOptions
}
export interface ITaskOptions {
    base?: string;//base path
    verbose?: boolean;//log all
    notify?: ITaskNotifyOptions;//config the notifications with gulp-notify
}
export enum SOURCEMAPS{
    no,//any sourcemaps
    yes,//sourcemaps in separated files
    inline//sourcemaps inline
    //also could be a string, it is a string, will be used as a path to write the sourcepas
}
/**
 * A abstract class to create task for process files in a easy way
 */
export abstract class BaseTask {
    public static readonly SOURCEMAPS = SOURCEMAPS;
    public static readonly NAME:String = "";
    protected abstract _name: string;//the name of the task. Will be used in notify and log and to register the tasks in gulp
    protected static readonly DEFAULTS: ITaskOptions = {
        base: "."
    };
    protected _gutil = gutil;
    protected _gulpPlumber = gulpPlumber;
    protected _gulpNotify = gulpNotify;
    protected _gulpDebug = gulpDebug;
    protected _gulpFilter = gulpFilter;
    protected _vfs = vfs;
    protected _gulp = gulp;
    protected _Vinyl = Vinyl;
    protected _path = path;
    protected _extend: any = extend;
    protected _gulpWatch = watch;
    protected _options: ITaskOptions;
    protected _logDebugTitle: string;
    protected _logger = Logger.getInstance();
    constructor() {
    }
    /**
     * Get default config.
     * @returns Object
     * @private
     */
    protected _getDefaults(): any {
        //The defaults are usually declared as static member, if a class that extends of BaseTask need to declare different defaults, it should overwrite _getDefaults
        return BaseTask.DEFAULTS;
    }

    /**
     * join the options to use
     * @param options
     * @returns {any}
     * @private
     */
    protected _joinOptions(options: ITaskOptions) {
        //see jquery extend
        let parsed = this._extend(true, {}, this._getDefaults(), options);
        return parsed;
    }

    /**
     * Process a file or list of files
     * @param params  Data for the process
     * @returns The stream for gulp
     * @private
     */
    protected _process(params: IProcessParams) {
        return this._vfs.src(params.filesToProcess)
        //catch errors
         .pipe(this._gulpPlumber({errorHandler: this._gulpNotifyError()}))//notifyError generates the config
         //log src files if verbose
         .pipe(
             this._options.verbose
                 ? this._gulpDebug({title: this._getLogMessage("Files")})
                 : this._gutil.noop()
         );
    }

    /**
     * Get the prefix for logs
     * @param text Text to include after the prefix
     * @returns {string}
     * @private
     * @example
     * if _name is "Sass"
     * _getLogDebugTitle("Success"); //[Sass] Success
     */
    protected _getLogMessage(text) {
        if (!this._logDebugTitle) {
            this._logDebugTitle = `[${this._gutil.colors.cyan(this._name)}]`;
        }
        return this._logDebugTitle + " " + text;
    }

    /**
     * Create the notify options for success
     * @returns {any}
     * @private
     */
    protected _gulpNotifySuccess() {
        if(this._options.notify.success.shutUp != true) {
            this._options.notify.success.title = this._name;
            this._options.notify.success.message = "Success";
            return this._gulpNotify(this._options.notify.success);
        }else{
            return this._gutil.noop();
        }
    }

    /**
     * Create the notify options for an error
     * @returns {any}
     * @private
     */
    protected _gulpNotifyError() {
        if(this._options.notify.error.shutUp != true) {
            this._options.notify.error.title = this._name;
            this._options.notify.error.message = "Error: <%= error.message %>";
            return this._gulpNotify.onError(this._options.notify.error);
        }else{
            return this._gutil.noop();
        }
    }
    /**
     * join the path of the files to watch prepending the src
     * @returns {Array}
     * @private
     */
    protected _joinFiles(files,base?) {
        let result = [],
            src = this._options.base;
        if(files != undefined) {
            if (!Array.isArray(files)) {
                files = [files];
            }
            for (let file of files) {
                result.push(this._path.join(base || src, file));
            }
        }
        return result;
    }
    /**
     * join the files to exclude creating a glob.
     * Exclude bower if it's configured
     * Exclude node_modules if it's configured
     * Exclude JSPM if it's configured
     * @returns {Array}
     * @private
     */
    protected _joinExcludeFiles(files,exclude:ITaskExcludePackageManagers={}) {
        let result = [],
            src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.join("!", src, file))
        }
        if (exclude.npm == true) {
            result.unshift("!" + this._path.join("node_modules", "**"));
        }
        if (exclude.bower) {
            result.unshift("!" + this._path.join("**","bower_components", "**"));
        }
        if (exclude.jspm) {
            result.unshift("!" + this._path.join("**","jspm_packages", "**"));
        }
        return result;
    }
    public abstract run(cb?:Function);
    /**
     * Register the tasks
     * @param gulp
     * @param task
     */
    static registerTasks(gulp, options:IRegisterTaskOptions) {
        let task = options.taskInstance ? options.taskInstance : new options.taskClass;
        let name = options.taskClass.NAME;
        gulp.task(
            `${name}`, function () {
                return task.run();
            }
        );
    };
}