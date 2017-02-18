import * as gulp from "gulp";
import {BaseTask} from "../BaseTask";
import * as gulpSass from "gulp-sass";
class SassTask extends BaseTask {
    protected _gulpSass = gulpSass;

    _applyCompilePlugin(stream: any, file) {
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
gulp.task(
    "sass", function () {
        return new SassTask(
            {
                files: "**/*.scss",
                notify: {
                    success: "Sass compiled",
                    error: "Sass failed"
                }
            }
        ).watch();
    }
);