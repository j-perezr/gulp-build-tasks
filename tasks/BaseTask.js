"use strict";
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
class BaseTask {
    constructor(options) {
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
        let notifySuccess = this._options.notify.success;
        if (typeof notifySuccess == "string") {
            this._options.notify.success = this._extend(true, {}, this._getDefaults().notify.success);
            this._options.notify.success.message = notifySuccess;
        }
        let notifyError = this._options.notify.success;
        if (typeof notifyError == "string") {
            this._options.notify.error = this._extend(true, {}, this._getDefaults().notify.error);
            this._options.notify.error.message = notifyError;
        }
        this._files = this._resolveFiles();
        this._toExclude = this._resolveExcludeFiles();
    }
    _getDefaults() {
        return BaseTask.DEFAULTS;
    }
    _resolveOptions(options) {
        return this._extend(true, {}, this._getDefaults(), options);
    }
    _compile(file) {
        let glob = this._options.compileAll ? this._files : file.path;
        let stream = this._vfs.src(this._files)
            .pipe(this._gulpPlumber({ errorHandler: this._gulpNotify.onError("Error: <%= error.message %>") }))
            .pipe(this._gulpDebug({ title: "Files" }))
            .pipe(this._gulpFilter(["**"].concat(this._toExclude)))
            .pipe(this._gulpDebug({ title: "Files after exclude" }));
        return this._applyCompilePlugin(stream, file)
            .pipe(this._gulpDebug({ title: "Output" }))
            .pipe(this._vfs.dest(this._options.dest))
            .pipe(this._notify());
    }
    _notify() {
        return this._gulpNotify(this._options.notify.success);
    }
    _notifyError() {
        return this._gulpNotify(this._options.notify.error);
    }
    _resolveFiles() {
        let files = this._options.files, result = [], src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.resolve(src, file));
        }
        return result;
    }
    _resolveExcludeFiles() {
        let files = this._options.exclude, result = [], src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.resolve(src, file));
        }
        if (this._options.node != undefined && this._options.node.exclude != false) {
            result.unshift("!" + this._path.join(this._options.node.path, "**"));
        }
        return result;
    }
    _onFileChange(vinyl) {
        return this._compile(vinyl);
    }
    watch() {
        return this._gulpWatch(this._files, this._options.watch, this._onFileChange.bind(this));
    }
    build() {
        return this._compile(this._files);
    }
}
BaseTask.DEFAULTS = {
    exclude: [],
    base: ".",
    dest: ".",
    compileAll: false,
    watch: {
        ignoreInitial: true,
        read: false
    },
    node: {
        exclude: true,
        path: "node_modules"
    },
    notify: {
        success: {
            message: "Done",
            onLast: true
        },
        error: {
            message: "Oh oh",
            onLast: true
        }
    }
};
exports.BaseTask = BaseTask;
//# sourceMappingURL=BaseTask.js.map