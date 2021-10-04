"use strict";

// const { Slave } = require("../src/index");
// const slave = new Slave({ path: "COM4", baudRate: 9600, address: 0x03 });
// slave.on("say", (data, reply) => {
//     console.log("say:");
//     console.log(data);
//     reply("我是从机pc，现在时间：" + new Date().toLocaleTimeString());
// });

// 轮询所有从几状态
const { Master, Slave } = require("../src/index");
const master = new Master({ path: "COM4", baudRate: 9600 });
!void async function () {
    let index = 1;
    while (1) {
        index++;
        for (let address of [ 0x01, 0x02 ]) {
            const { data } = await master.say(address, "hello " + index);
            console.log("从机" + address + "：" + data);
        }
        await sleep(50);
    }

}();
async function sleep (ms = 1000) {
    return new Promise(r => {
        setTimeout(r, ms);
    });
}

// 搜索总线上所有在线RS485终端
// master.getDeviceList().then(list => {
//     console.log(list);
// })
