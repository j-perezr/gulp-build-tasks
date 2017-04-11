import {PugTask} from "./PugTask";
import * as gulp from "gulp";
PugTask.registerTasks(gulp,{
    taskClass:PugTask,
    taskInstance:new PugTask(
        {
            files: "**/*.pug"
        }
    )
});
