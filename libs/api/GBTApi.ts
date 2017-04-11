import * as path from "path";
import * as extend from "extend";
import * as requireDir from "require-dir";
import * as gulp from "gulp";
export class GBTApi{
    protected static instance;
    protected _extend = extend;
    protected _path = path;
    protected _requireDir = requireDir;
    protected _gulp = gulp;
    protected constructor (){
    }
    public loadTasks(from?){
        this._requireDir(from || this._path.resolve(__dirname,'..','tasks'), {recurse: true});
        return this;
    }
    public run(task="default"){
       this._gulp.start(task);
       return this;
    }
    public static getInstance(){
        if(!GBTApi.instance){
            GBTApi.instance = new GBTApi();
        }
        return GBTApi.instance;
    }
}
