"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulpSass = require("gulp-sass");
const extend = require("extend");
const JspmUtils_1 = require("../../JspmUtils");
const BaseTranspilerTask_1 = require("../BaseTranspilerTask");
class SassTask extends BaseTranspilerTask_1.BaseTranspilerTask {
    constructor(options) {
        super();
        this._name = "Sass";
        this._gulpSass = gulpSass;
        this._options = this._joinOptions(options);
        this._init();
    }
    _initJspmImporter() {
        if (this._options.sass.functions == undefined && this._options.sass.importer == undefined) {
            try {
                const sassJspm = require("sass-jspm-importer");
                this._options.sass.functions = sassJspm.resolve_function(JspmUtils_1.JspmUtils.getInstance().getPath());
                this._options.sass.importer = sassJspm.importer;
                this._logger.info(this._name, "JSPM importer initialized");
            }
            catch (e) {
                this._logger.warn(this._name, "JSPM is not initialized or installed, JSPM packages will not be processed");
            }
        }
    }
    _init() {
        this._initJspmImporter();
        super._init();
        this._options.notify.success.icon = this._path.resolve(__dirname, "assets/notify.png");
        this._options.notify.error.icon = this._path.resolve(__dirname, "assets/notify.png");
    }
    _applyCompilePlugin(stream, file) {
        return stream.pipe(this._gulpSass(this._options.sass));
    }
    _getDefaults() {
        return SassTask.DEFAULTS;
    }
}
SassTask.NAME = "sass";
//extend from defaults of BaseTask
SassTask.DEFAULTS = extend(true, {}, BaseTranspilerTask_1.BaseTranspilerTask.DEFAULTS, {
    compileAll: true,
    sass: {
        outputStyle: "expanded",
        sourceComments: true,
        errLogToConsole: true,
    }
});
exports.SassTask = SassTask;
//# sourceMappingURL=SassTask.js.map