import * as jspm from "jspm";
import * as path from "path";
export class JspmUtils{
    protected static instance;
    protected _jspm = jspm;
    protected _jspmPath:String;
    protected _path = path;
    private constructor(){
    }
    public getPath(){
        if(!this._jspmPath){
            let path = this._jspm.Loader().baseURL.replace("file:///","");
            path = this._path.join(path,"jspm_packages");
            this._jspmPath = path;
        }
        return this._jspmPath;
    }
    public static getInstance(){
        if(!JspmUtils.instance){
            JspmUtils.instance = new JspmUtils();
        }
        return JspmUtils.instance;
    }
}
