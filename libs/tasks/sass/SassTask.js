"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulpSass = require("gulp-sass");
const extend = require("extend");
const sassJspm = require("sass-jspm-importer");
const JspmUtils_1 = require("../../JspmUtils");
const BaseTranspilerTask_1 = require("../BaseTranspilerTask");
class SassTask extends BaseTranspilerTask_1.BaseTranspilerTask {
    constructor(options) {
        super();
        this._name = "Sass";
        this._gulpSass = gulpSass;
        this._sassJspm = sassJspm;
        this._options = this._joinOptions(options);
        this._init();
    }
    _init() {
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
    static registerTasks(gulp, taskInstance) {
        taskInstance = taskInstance || new SassTask({
            files: "**/*.scss"
        });
        super.registerTasks(gulp, taskInstance);
    }
}
//extend from defaults of BaseTask
SassTask.DEFAULTS = extend(true, {}, BaseTranspilerTask_1.BaseTranspilerTask.DEFAULTS, {
    compileAll: true,
    sass: {
        outputStyle: "expanded",
        sourceComments: true,
        errLogToConsole: true,
        functions: sassJspm.resolve_function(JspmUtils_1.JspmUtils.getInstance().getPath()),
        importer: sassJspm.importer
    }
});
exports.SassTask = SassTask;
//# sourceMappingURL=SassTask.js.map