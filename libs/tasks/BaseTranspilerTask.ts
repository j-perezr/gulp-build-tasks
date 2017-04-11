import * as gulpSourcemaps from "gulp-sourcemaps";
import * as Vinyl from "vinyl";
import * as extend from "extend";
import {
    BaseTask, IProcessParams, IRegisterTaskOptions, ITaskDestOptions, ITaskExcludePackageManagers, ITaskNotifyOptions,
    ITaskOptions, SOURCEMAPS
} from "./BaseTask";
/**
 * Options for gulp-watch
 */
export interface IGulpWatchOptions {
    name?: string;
    ignoreInitial?: boolean;
    read?: boolean;
    base?: string;
}
export interface ITranspilerTaskOptions extends ITaskOptions {
    files: string | string[],//glob to watch
    exclude?: string[],//glob to exclude
    base?: string;//base path
    dest?: ITaskDestOptions | string ;//destination
    watch?: IGulpWatchOptions;//watch config. See https://github.com/floatdrop/gulp-watch#options
    compileAll?: boolean;//compile all files in each change.
    sourcemaps?: SOURCEMAPS | string;//config for sourcemaps
    excludeConfig?: ITaskExcludePackageManagers,
    verbose?: boolean;//log all
    notify?: ITaskNotifyOptions;//config the notifications with gulp-notify
}

/**
 * A abstract class to create task for process files in a easy way
 */
export abstract class BaseTranspilerTask extends BaseTask {
    protected abstract _name: string;//the name of the task. Will be used in notify and log and to register the tasks in gulp
    protected static readonly DEFAULTS: ITranspilerTaskOptions = extend(
        true, {}, BaseTask.DEFAULTS, {
            exclude: [],
            files: "",
            dest: {
                path: "."
            },
            compileAll: false,
            sourcemaps: BaseTranspilerTask.SOURCEMAPS.yes,
            watch: {
                ignoreInitial: true,
                read: false,
                base: process.cwd()
            },
            excludeConfig: {
                npm: true,
                bower: true,
                jspm: true
            },
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
        });
    protected _watching;
    protected _gulpSourcemaps = gulpSourcemaps;
    protected _options: ITranspilerTaskOptions;
    protected _toExclude;
    protected _files: string[];
    protected _logDebugTitle: string;

    constructor() {
        super();
    }

    protected _init() {
        this._files = this._joinFiles(this._options.files);
        this._toExclude = this._joinExcludeFiles(this._options.exclude, this._options.excludeConfig);
    }

    /**
     * Get default config.
     * @returns Object
     * @private
     */
    protected _getDefaults(): any {
        //The defaults are usually declared as static member, if a class that extends of BaseTranspilerTask need to declare different defaults, it should overwrite _getDefaults
        return BaseTranspilerTask.DEFAULTS;
    }

    /**
     * Process a file or list of files
     * @param params  Data for the process
     * @returns The stream for gulp
     * @private
     */
    protected _process(params: IProcessParams) {
        let stream = this._vfs.src(params.filesToProcess)
                         .pipe(this._gulpPlumber({errorHandler: this._gulpNotifyError()}))//notifyError
                         //log src files if verbose
                         .pipe(
                             this._options.verbose
                                 ? this._gulpDebug({title: this._getLogMessage("Files")})
                                 : this._gutil.noop()
                         )
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
                   .pipe(this._gulpNotifySuccess())
                   //write files
                   .pipe(
                       this._vfs.dest(
                           (<ITaskDestOptions>this._options.dest).path,
                           (<ITaskDestOptions>this._options.dest).options
                       )
                   );
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
        this._watching = true;
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

    run() {
        this.build();
        this.watch();
    }

    /**
     * Register the tasks
     * @param gulp
     * @param task
     */
    static registerTasks(gulp, options: IRegisterTaskOptions) {
        let task = options.taskInstance || new options.taskClass();
        let name = options.taskClass.NAME;
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