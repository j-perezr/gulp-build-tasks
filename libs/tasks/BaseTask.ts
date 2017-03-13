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
import * as gulpSourcemaps from "gulp-sourcemaps";
/**
 * Options for gulp-watch
 */
export interface IGulpWatchOptions {
    name?:string;
    ignoreInitial?: boolean;
    read?: boolean;
    base?:string;
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
    files: string | string[],//glob to watch
    exclude?: string[],//glob to exclude
    base?: string;//base path
    dest?: ITaskDestOptions | string ;//destination
    watch?: IGulpWatchOptions;//watch config. See https://github.com/floatdrop/gulp-watch#options
    compileAll?: boolean;//compile all files in each change.
    sourcemaps?: SOURCEMAPS | string;//config for sourcemaps
    excludeNode?: boolean;//exclude node_modules folder
    excludeBower?: boolean | string;//exclude bower from watch, if is a string, it will be used as path
    excludeJSPM?: boolean | string;//exclude jspm from watch, if is a string, it will be used as path
    verbose?: boolean;//log all
    notify?: ITaskNotifyOptions;//config the notifications with gulp-notify
}
/**
 * Options for process
 */
export interface IProcessParams {
    fileChanged?: Vinyl;
    filesToProcess?: string | string[]
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
    protected abstract _name: string;//the name of the task. Will be used in notify and log and to register the tasks in gulp
    protected static readonly DEFAULTS: ITaskOptions = {
        exclude: [],
        files: "",
        base: ".",
        dest: ".",
        compileAll: false,
        sourcemaps: BaseTask.SOURCEMAPS.yes,
        watch: {
            ignoreInitial: true,
            read: false,
            base:process.cwd()
        },
        excludeNode: true,
        excludeBower: true,
        excludeJSPM: true,
        verbose: false,
        notify: {
            success: {
                timeout: 2000,
                sound: false,
                onLast: true
            },
            error: {
                timeout: 5000,
                sound: true,
                onLast: true
            }
        }
    };
    protected _gulpSourcemaps = gulpSourcemaps;
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
    protected _toExclude;
    protected _files: string[];
    protected _logDebugTitle: string;

    constructor(options: ITaskOptions) {
        this._options = this._joinOptions(options);
        this._files = this._joinFiles();
        this._toExclude = this._joinExcludeFiles();
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
        parsed.watch.name = parsed.watch.name || this._name;
        if (typeof parsed.dest == "string") {
            parsed.dest = {
                path: parsed.dest,
                options: {}
            }
        }
        if (parsed.sourcemaps != undefined) {
            let path;
            switch (parsed.sourcemaps) {
                case BaseTask.SOURCEMAPS.inline:
                    path = true;
                    break;
                case BaseTask.SOURCEMAPS.no:
                    path = false;
                    break;
                case BaseTask.SOURCEMAPS.yes:
                    path = ".";
                    break;
                default:
                    path = parsed.sourcemaps;
                    break;
            }
            parsed.dest.options = this._extend(true, {}, {sourcemaps: path}, parsed.dest.options);
        }
        return parsed;
    }

    /**
     * Process a file or list of files
     * @param params  Data for the process
     * @returns The stream for gulp
     * @private
     */
    protected _process(params: IProcessParams) {
        let stream = this._vfs.src(params.filesToProcess)
        //catch errors
                         .pipe(this._gulpPlumber({errorHandler: this._notifyError()}))//notifyError generates the config
                         //log src files if verbose
                         .pipe(
                             this._options.verbose
                                 ? this._gulpDebug({title: this._getLogMessage("Files")})
                                 : this._gutil.noop()
                         )
                         //apply filter to exclude
                         .pipe(this._gulpFilter(["**"].concat(this._toExclude)))
                         //log result after apply filter if verbose
                         .pipe(
                             this._options.verbose
                                 ? this._gulpDebug({title: this._getLogMessage("Files after exclude")})
                                 : this._gutil.noop()
                         )
                         .pipe(this._gulpSourcemaps.init());
        return this._applyCompilePlugin(stream, params)
                   //log output result
                   .pipe(this._gulpDebug({title: this._getLogMessage("Output")}))
                   .pipe(this._notify())
                   //write files
                   .pipe(
                       this._vfs.dest(
                           (<ITaskDestOptions>this._options.dest).path,
                           (<ITaskDestOptions>this._options.dest).options
                       )
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
    protected _notify() {
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
    protected _notifyError() {
        if(this._options.notify.error.shutUp != true) {
            this._options.notify.error.title = this._name;
            this._options.notify.error.message = "Error: <%= error.message %>";
            return this._gulpNotify.onError(this._options.notify.error);
        }else{
            return this._gutil.noop();
        }
    }

    /**
     * The function that applies the true process of the files.
     * Recieves a stream and the data of the changes
     * MUST return the stream to use
     * @param stream The stream to work with
     * @param params
     * @private
     * @example
     * _applyCompilePlugin(stream: any, file) {
     *  return stream.pipe(this._gulpSass());
     *}
     */
    protected abstract _applyCompilePlugin(stream, params: IProcessParams): any;

    /**
     * join the path of the files to watch prepending the src
     * @returns {Array}
     * @private
     */
    protected _joinFiles() {
        let files = this._options.files,
            result = [],
            src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.join(src, file));
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
    protected _joinExcludeFiles() {
        let files = this._options.exclude,
            result = [],
            src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.join("!", src, file))
        }
        if (this._options.excludeNode == true) {
            result.unshift("!" + this._path.join("node_modules", "**"));
        }
        if (!!this._options.excludeBower) {
            result.unshift(
                "!" + this._path.join(
                    this._options.excludeBower == true
                        ? "bower_components"
                        : this._options.excludeBower, "**"
                )
            );
        }
        if (!!this._options.excludeJSPM) {
            result.unshift(
                "!" + this._path.join(
                    this._options.excludeJSPM == true
                        ? "**/jspm_packages"
                        : this._options.excludeJSPM, "**"
                )
            );
        }
        return result;
    }

    /**
     * Fired when a file changes. Call to _process
     * @param vinyl
     * @returns {any|NodeJS.ReadWriteStream}
     * @private
     */
    protected _onFileChange(vinyl: Vinyl) {
        return this._process(
            {
                fileChanged: vinyl,
                filesToProcess: this._options.compileAll ? this._files : vinyl.path
            }
        );
    }

    /**
     * Watch the globs and fires _onFileChange
     * Return the stream
     * @returns {any}
     */
    watch() {
        this._gutil.log(this._getLogMessage("Waiting for changes"));
        return this._gulpWatch(this._files, this._options.watch, this._onFileChange.bind(this));
    }

    /**
     * Process al files
     */
    build() {
        this._gutil.log(this._getLogMessage("Building"));
        return this._process(
            {
                filesToProcess: this._files
            }
        );
    }

    /**
     * Register the tasks
     * @param gulp
     * @param task
     */
    static registerTasks(gulp, task: BaseTask) {
        let name = task._name.toLowerCase();
        gulp.task(
            `${name}:build`, function () {
                return task.build();
            }
        );
        gulp.task(
            `${name}:watch`, function () {
                return task.watch()
            }
        );
        gulp.task(name, [`${name}:build`, `${name}:watch`]);
    };
}