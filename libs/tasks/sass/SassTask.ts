import {IRegisterTaskOptions, ITaskOptions} from "../BaseTask";
import * as gulpSass from "gulp-sass";
import * as extend from "extend";
import {JspmUtils} from "../../JspmUtils";
import {BaseTranspilerTask, ITranspilerTaskOptions} from "../BaseTranspilerTask";
export interface ISassTaskOptions extends ITranspilerTaskOptions {
    sass?: any;//see https://github.com/sass/node-sass#outputstyle
}
export class SassTask extends BaseTranspilerTask {
    public static readonly NAME = "sass";
    //extend from defaults of BaseTask
    protected static readonly DEFAULTS: ISassTaskOptions = extend(
        true, {}, BaseTranspilerTask.DEFAULTS, {
            compileAll: true,
            sass: {
                outputStyle: "expanded",
                sourceComments: true,
                errLogToConsole: true,
            }
        }
    );
    protected _options: ISassTaskOptions;
    protected _name = "Sass";
    protected _gulpSass = gulpSass;
    constructor(options: ISassTaskOptions) {
        super();
        this._options = this._joinOptions(options);
        this._init();
    }
    protected _initJspmImporter(){
        if(this._options.sass.functions == undefined && this._options.sass.importer == undefined){
            try {
                const sassJspm = require("sass-jspm-importer");
                this._options.sass.functions = sassJspm.resolve_function(JspmUtils.getInstance().getPath());
                this._options.sass.importer = sassJspm.importer;
                this._logger.info(this._name,"JSPM importer initialized");
            }catch(e){
                this._logger.warn(this._name,"JSPM is not initialized or installed, JSPM packages will not be processed");
            }
        }
    }
    protected _init(){
        this._initJspmImporter();
        super._init();
        this._options.notify.success.icon = this._path.resolve(__dirname,"assets/notify.png");
        this._options.notify.error.icon = this._path.resolve(__dirname,"assets/notify.png");
    }
    protected _applyCompilePlugin(stream: any, file) {
        return stream.pipe(this._gulpSass(this._options.sass));
    }

    protected _getDefaults(): any {
        return SassTask.DEFAULTS;
    }
}
