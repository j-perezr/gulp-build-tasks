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
    protected static instances:Map<string,Logger> = new Map();
    protected _gutil = gutil;
    protected _level:LoggerLevel;
    protected _title:string;
    protected constructor(){
        this.setLevel(LoggerLevel.info);
    }
    public setTitle(title:string){
        this._title = title;
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
    protected _prepareMessage(title:string,type:LogTypes,messages:string|Object|any){
        let processedMessages:String|String[] = [];
        if(!Array.isArray(messages)){
            messages = [messages];
        }
        if(this._title != undefined){
            messages.unshift(title);
        }
        if(typeof messages == "object"){
            try {
                for(let message of messages) {
                    if(typeof message == "object"){
                        message = JSON.stringify(message, null, 4);
                    }
                    processedMessages.push(message);
                }
                processedMessages = (<String[]>processedMessages).join(" ");
            } catch (e) {
                type = LogTypes.error;
                processedMessages = "Error on logging: " + e.message;
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
        titleStr = this._gutil.colors.cyan(title)+" -";
        return `${typeStr} ${titleStr} ${processedMessages}`
    }
    public setLevel(level:LoggerLevel){
        this._level = level;
    }
    public static getInstance(id:string="default"):Logger{
        let instance = Logger.instances.get(id);
        if(!instance){
            instance = new Logger();
            Logger.instances.set(id,instance);
        }
        return instance;
    }
}