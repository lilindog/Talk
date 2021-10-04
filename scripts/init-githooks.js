"use strict";

const 
    { readdirSync, writeFileSync } = require("fs"),
    { exec } = require("child_process"),
    platform = require("os").platform(),
    path = require("path");

!void function () {
    (process.env.INIT_CWD || "").endsWith(process.env.npm_package_name) && main();
}();

function main () {
    const 
    generatedHooks = [],
    hooks = readdirSync(path.resolve(__dirname)).filter(file => readdirSync(path.resolve(__dirname, "../.git/hooks")).includes(path.basename(file, ".js") + ".sample"));
    hooks.forEach(hook => (generatedHooks.push(path.basename(hook, ".js")), generatorHookFile(hook)));
    platform !== "win32" && exec(`sudo chmod -R 777 ` + path.resolve(__dirname, "../.git/hooks"));
    console.log("已生成githooks：");
    console.table(hooks);
}   

function generatorHookFile (file) {
    const code = (`
    #!/usr/bin/env node
    const { spawn } = require("child_process");
    (spawn("node", [ "${path.resolve(__dirname, file).replace(/\\/g, "\\\\")}" ], {
        stdio: "inherit"
    }))
    .on("error", err => process.exit(1))
    .on("exit", code => process.exit(code));
    `)
    .replace(/(\s)+/g, "").replace("#!/usr/bin/envnode", "#!/usr/bin/env node\n");
    writeFileSync(path.resolve(__dirname, "../.git/hooks", path.basename(file, ".js")), code);
}