"use strict";
const BaseTask_1 = require("../BaseTask");
const gulpSass = require("gulp-sass");
const extend = require("extend");
class SassTask extends BaseTask_1.BaseTask {
    constructor(options) {
        super(options);
        this._name = "Sass";
        this._gulpSass = gulpSass;
    }
    _applyCompilePlugin(stream, file) {
        return stream.pipe(this._gulpSass(this._options.sass));
    }
    _getDefaults() {
        return SassTask.DEFAULTS;
    }
    static registerTasks(gulp, taskInstance) {
        taskInstance = taskInstance || new SassTask({
            files: "**/*.scss",
            shutup: SassTask.SHUT_UP.success
        });
        super.registerTasks(gulp, taskInstance);
    }
}
//extend from defaults of BaseTask
SassTask.DEFAULTS = extend(true, {}, BaseTask_1.BaseTask.DEFAULTS, {
    compileAll: true,
    sass: {
        outputStyle: "expanded",
        sourceComments: true
    }
});
exports.SassTask = SassTask;
//# sourceMappingURL=SassTask.js.map