"use strict";
const gulp = require("gulp");
const BaseTask_1 = require("../BaseTask");
const gulpSass = require("gulp-sass");
class SassTask extends BaseTask_1.BaseTask {
    constructor() {
        super(...arguments);
        this._gulpSass = gulpSass;
    }
    _applyCompilePlugin(stream, file) {
        return stream.pipe(this._gulpSass());
        //return this._vfs.src(this._files)
        //           .pipe(debug({title:"Files"}))
        //           .pipe(filter(["**"].concat(this._toExclude)))
        //           .pipe(debug({title:"Filtered"}))
        //           .pipe(gulpSass())
        //           .pipe(debug({title:"Sass"}))
        //           .pipe(this._vfs.dest(this._options.dest));
    }
}
gulp.task("sass", function () {
    return new SassTask({
        files: "**/*.scss",
        notify: {
            success: "Sass compiled",
            error: "Sass failed"
        }
    }).watch();
});
//# sourceMappingURL=SassTask.js.map