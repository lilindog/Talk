"use strict";

const 
    { spawn } = require("child_process"),
    platform = require("os").platform();

spawn("npm", [ "run", "lint" ], { stdio: "inherit", shell: platform === "win32" })
.on("error", err => {
    console.log(err);
    console.log("代码检测未通过 ):");
    process.exit(1);
})
.on("close", code => {
    console.log(code === 0 ? "代码检测通过 :)" : "代码检测未通过 ):");
    process.exit(code);
});