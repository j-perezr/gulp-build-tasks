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
export interface IGulpWatchOptions {
    ignoreInitial?: boolean;
}
export interface INotifySuccess extends INotifyOptions {

}
export interface INotifyError extends INotifyOptions {

}
export interface INotifyOptions {
    message: string;
    onLast?: boolean;
}
export interface ITaskNodeOptions {
    exclude?: boolean;
    path?: string;
}
export interface ITaskOptions {
    files: string | string[],
    exclude?: string[],
    base?: string;
    dest?: string;
    watch?: IGulpWatchOptions;
    compileAll?: boolean;
    node?: ITaskNodeOptions;
    notify: { success: string | INotifySuccess, error: string | INotifyError };
}
export abstract class BaseTask {
    protected static readonly DEFAULTS = {
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

    constructor(options: ITaskOptions) {
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

    _resolveOptions(options: ITaskOptions) {
        return this._extend(true, {}, this._getDefaults(), options);
    }

    _compile(file: Vinyl) {
        let glob = this._options.compileAll ? this._files : file.path;
        let stream = this._vfs.src(this._files)
                         .pipe(this._gulpPlumber({errorHandler: this._gulpNotify.onError("Error: <%= error.message %>")}))
                         .pipe(this._gulpDebug({title: "Files"}))
                         .pipe(this._gulpFilter(["**"].concat(this._toExclude)))
                         .pipe(this._gulpDebug({title: "Files after exclude"}));
        return this._applyCompilePlugin(stream, file)
                   .pipe(this._gulpDebug({title: "Output"}))
                   .pipe(this._vfs.dest(this._options.dest))
                   .pipe(this._notify());
    }

    _notify() {
        return this._gulpNotify(this._options.notify.success);
    }

    _notifyError() {
        return this._gulpNotify(this._options.notify.error);
    }

    abstract _applyCompilePlugin(file: Vinyl, stream): any;

    _resolveFiles() {
        let files = this._options.files,
            result = [],
            src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.resolve(src, file))
        }
        return result;
    }

    _resolveExcludeFiles() {
        let files = this._options.exclude,
            result = [],
            src = this._options.base;
        if (!Array.isArray(files)) {
            files = [files];
        }
        for (let file of files) {
            result.push(this._path.resolve(src, file))
        }
        if (this._options.node != undefined && this._options.node.exclude != false) {
            result.unshift("!" + this._path.join(this._options.node.path, "**"));
        }
        return result;
    }

    _onFileChange(vinyl: Vinyl) {
        return this._compile(vinyl);
    }

    watch() {
        return this._gulpWatch(this._files, this._options.watch, this._onFileChange.bind(this));
    }

    build() {
        return this._compile(this._files);
    }
}