import * as path from "path";
import * as extend from "extend";
import * as requireDir from "require-dir";
import * as gulp from "gulp";
export class Api{
    public static DEFAULTS = {
        base:process.cwd()
    };
    protected _extend = extend;
    protected _path = path;
    protected _requireDir = requireDir;
    protected _gulp = gulp;
    protected _options;
    constructor (options){
        this._options = this._extend(true,{},Api.DEFAULTS,options);
    }
    public loadTasks(from?){
        this._requireDir(from || this._path.resolve(__dirname,'..','tasks'), {recurse: true});
        return this;
    }
    public run(task="default"){
       this._gulp.start(task);
       return this;
    }
}
