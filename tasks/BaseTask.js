"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp = require("gulp");
const extend = require("extend");
const path = require("path");
const watch = require("gulp-watch");
const Vinyl = require("vinyl");
const vfs = require("vinyl-fs");
const gulpFilter = require("gulp-filter");
const gulpDebug = require("gulp-debug");
const gulpNotify = require("gulp-notify");
const gulpPlumber = require("gulp-plumber");
const gutil = require("gulp-util");
const gulpSourcemaps = require("gulp-sourcemaps");
var SOURCEMAPS;
(function (SOURCEMAPS) {
    SOURCEMAPS[SOURCEMAPS["no"] = 0] = "no";
    SOURCEMAPS[SOURCEMAPS["yes"] = 1] = "yes";
    SOURCEMAPS[SOURCEMAPS["inline"] = 2] = "inline"; //sourcemaps inline
    //also could be a string, it is a string, will be used as a path to write the sourcepas
})(SOURCEMAPS = exports.SOURCEMAPS || (exports.SOURCEMAPS = {}));
/**
 * A abstract class to create task for process files in a easy way
 */
class BaseTask {
    constructor(options) {
        this._gulpSourcemaps = gulpSourcemaps;
        this._gutil = gutil;
        this._gulpPlumber = gulpPlumber;
        this._gulpNotify = gulpNotify;
        this._gulpDebug = gulpDebug;
        this._gulpFilter = gulpFilter;
        this._vfs = vfs;
        this._gulp = gulp;
        this._Vinyl = Vinyl;
        this._path = path;
        this._extend = extend;
        this._gulpWatch = watch;
        this._options = this._resolveOptions(options);
        this._files = this._resolveFiles();
        this._toExclude = this._resolveExcludeFiles();
    }
    /**
     * Get default config.
     * @returns Object
     * @private
     */
    _getDefaults() {
        //The defaults are usually declared as static member, if a class that extends of BaseTask need to declare different defaults, it should overwrite _getDefaults
        return BaseTask.DEFAULTS;
    }
    /**
     * Resolve the options to use
     * @param options
     * @returns {any}
     * @private
     */
    _resolveOptions(options) {
        //see jquery extend
        let parsed = this._extend(true, {}, this._getDefaults(), options);
        if (typeof parsed.dest == "string") {
            parsed.dest = {
                path: parsed.dest,
                options: {}
            };
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
            parsed.dest.options = this._extend(true, {}, { sourcemaps: path }, parsed.dest.options);
        }
        return parsed;
    }
    /**
     * Process a file or list of files
     * @param params  Data for the process
     * @returns The stream for gulp
     * @private
     */
    _process(params) {
        let stream = this._vfs.src(params.filesToProcess)
            .pipe(this._gulpPlumber({ errorHandler: this._notifyError() })) //notifyError generates the config
            .pipe(this._options.verbose
            ? this._gulpDebug({ title: this._getLogMessage("Files") })
            : this._gutil.noop())
            .pipe(this._gulpFilter(["**"].concat(this._toExclude)))
            .pipe(this._options.verbose
            ? this._gulpDebug({ title: this._getLogMessage("Files after exclude") })
            : this._gutil.noop())
            .pipe(this._gulpSourcemaps.init());
        return this._applyCompilePlugin(stream, params)
            .pipe(this._gulpDebug({ title: this._getLogMessage("Output") }))
            .pipe(this._notify())
            .pipe(this._vfs.dest(this._options.dest.path, this._options.dest.options));
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
    _getLogMessage(text) {
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
    _notify() {
        if (this._options.notify.success.shutUp != true) {
            this._options.notify.success.title = this._name;
            this._options.notify.success.message = "Success";
            return this._gulpNotify(this._options.notify.success);
        }
        else {
            return this._gutil.noop();
        }
    }
    /**
     * Create the notify options for an error
     * @returns {any}
     * @private
     */
    _notifyError() {
        if (this._options.notify.error.shutUp != true) {
            this._options.notify.error.title = this._name;
            this._options.notify.error.message = "Error: <%= error.message %>";
            return this._gulpNotify.onError(this._options.notify.error);
        }
        else {
            return this._gutil.noop();
        }
    }
    /**
     * Resolve the path of the files to watch prepending the src
     * @returns {Array}
     * @private
     */
    _resolveFiles() {
        let files = this._options.files, result = [], src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.join(src, file));
        }
        return result;
    }
    /**
     * Resolve the files to exclude creating a glob.
     * Exclude bower if it's configured
     * Exclude node_modules if it's configured
     * Exclude JSPM if it's configured
     * @returns {Array}
     * @private
     */
    _resolveExcludeFiles() {
        let files = this._options.exclude, result = [], src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.join("!", src, file));
        }
        if (this._options.excludeNode == true) {
            result.unshift("!" + this._path.join("node_modules", "**"));
        }
        if (!!this._options.excludeBower) {
            result.unshift("!" + this._path.join(this._options.excludeBower == true
                ? "bower_components"
                : this._options.excludeBower, "**"));
        }
        if (!!this._options.excludeJSPM) {
            result.unshift("!" + this._path.join(this._options.excludeJSPM == true
                ? "jspm_packages"
                : this._options.excludeJSPM, "**"));
        }
        return result;
    }
    /**
     * Fired when a file changes. Call to _process
     * @param vinyl
     * @returns {any|NodeJS.ReadWriteStream}
     * @private
     */
    _onFileChange(vinyl) {
        return this._process({
            fileChanged: vinyl,
            filesToProcess: this._options.compileAll ? this._files : vinyl.path
        });
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
        return this._process({
            filesToProcess: this._files
        });
    }
    /**
     * Register the tasks
     * @param gulp
     * @param task
     */
    static registerTasks(gulp, task) {
        let name = task._name.toLowerCase();
        gulp.task(`${name}:build`, function () {
            return task.build();
        });
        gulp.task(`${name}:watch`, function () {
            return task.watch();
        });
        gulp.task(name, [`${name}:build`, `${name}:watch`]);
    }
    ;
}
BaseTask.SOURCEMAPS = SOURCEMAPS;
BaseTask.DEFAULTS = {
    exclude: [],
    files: "",
    base: ".",
    dest: ".",
    compileAll: false,
    sourcemaps: BaseTask.SOURCEMAPS.yes,
    watch: {
        ignoreInitial: true,
        read: false
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
exports.BaseTask = BaseTask;
//# sourceMappingURL=BaseTask.js.map