/**
 * @license
 * Copyright Davinchi. All Rights Reserved.
 */
import * as gutil from "gulp-util";
export enum LoggerLevel{
    error,
    warn,
    info,
    verbose
}
enum LogTypes{
    error,
    warn,
    info,
    log
}
export class Logger{
    protected static instance:Logger;
    protected _gutil = gutil;
    protected _level:LoggerLevel;
    protected constructor(){
        this.setLevel(LoggerLevel.info);
    }
    public info(title:string,...message){
        if(this._level >= LoggerLevel.info) {
            this._gutil.log(this._prepareMessage(title, LogTypes.info, message));
        }
    }
    public error(title:string,...message){
        if(this._level >= LoggerLevel.error) {
            this._gutil.log(this._prepareMessage(title, LogTypes.error, message));
        }
    }
    public warn(title:string,...message){
        if(this._level >= LoggerLevel.warn) {
            this._gutil.log(this._prepareMessage(title, LogTypes.warn, message));
        }
    }
    public log(title:string,...message){
        if(this._level >= LoggerLevel.verbose) {
            this._gutil.log(this._prepareMessage(title, LogTypes.log, message));
        }
    }
    protected _prepareMessage(title:string,type:LogTypes,message:string|Object){
        if(typeof message == "object"){
            if(Array.isArray(message)){
                message = message.join(" ");
            }else {
                try {
                    message = JSON.stringify(message, null, 4);
                } catch (e) {
                    type = LogTypes.error;
                    message = "Error on logging: " + e.message;
                }
            }
        }
        let typeStr,
            titleStr;
        switch(type){
            case LogTypes.error:
                typeStr = this._gutil.colors.red(`[ERROR]`);
                break;
            case LogTypes.warn:
                typeStr = this._gutil.colors.yellow(`[WARN]`);
                break;
            case LogTypes.info:
                typeStr = this._gutil.colors.cyan(`[INFO]`);
                break;
            case LogTypes.log:
                typeStr = this._gutil.colors.white(`[LOG]`);
                break;
        }
        titleStr = this._gutil.colors.white(title+" -");
        return `${typeStr} ${titleStr} ${message}`
    }
    public setLevel(level:LoggerLevel){
        this._level = level;
    }
    public static getInstance():Logger{
        if(!Logger.instance){
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
}