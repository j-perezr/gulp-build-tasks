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
var PACKAGE_MANAGERS;
(function (PACKAGE_MANAGERS) {
    PACKAGE_MANAGERS[PACKAGE_MANAGERS["bower"] = 0] = "bower";
    PACKAGE_MANAGERS[PACKAGE_MANAGERS["npm"] = 1] = "npm";
    PACKAGE_MANAGERS[PACKAGE_MANAGERS["jspm"] = 2] = "jspm";
})(PACKAGE_MANAGERS = exports.PACKAGE_MANAGERS || (exports.PACKAGE_MANAGERS = {}));
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
    constructor() {
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
     * join the options to use
     * @param options
     * @returns {any}
     * @private
     */
    _joinOptions(options) {
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
    _process(params) {
        return this._vfs.src(params.filesToProcess)
            .pipe(this._gulpPlumber({ errorHandler: this._gulpNotifyError() })) //notifyError generates the config
            .pipe(this._options.verbose
            ? this._gulpDebug({ title: this._getLogMessage("Files") })
            : this._gutil.noop());
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
    _gulpNotifySuccess() {
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
    _gulpNotifyError() {
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
     * join the path of the files to watch prepending the src
     * @returns {Array}
     * @private
     */
    _joinFiles(files, base) {
        let result = [], src = this._options.base;
        if (files != undefined) {
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
    _joinExcludeFiles(files, exclude = {}) {
        let result = [], src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.join("!", src, file));
        }
        if (exclude.npm == true) {
            result.unshift("!" + this._path.join("node_modules", "**"));
        }
        if (exclude.bower) {
            result.unshift("!" + this._path.join("**", "bower_components", "**"));
        }
        if (exclude.jspm) {
            result.unshift("!" + this._path.join("**", "jspm_packages", "**"));
        }
        return result;
    }
    /**
     * Register the tasks
     * @param gulp
     * @param task
     */
    static registerTasks(gulp, task) {
        let name = task._name.toLowerCase();
        gulp.task(`${name}`, function () {
            return task.run();
        });
    }
    ;
}
BaseTask.SOURCEMAPS = SOURCEMAPS;
BaseTask.DEFAULTS = {
    base: ".",
    verbose: false
};
exports.BaseTask = BaseTask;
//# sourceMappingURL=BaseTask.js.map