import {SassTask} from "./SassTask";
import * as gulp from "gulp";
SassTask.registerTasks(gulp,{
    taskClass:SassTask,
    taskInstance: new SassTask(
        {
            files: "**/*.scss"
        }
    )
});
