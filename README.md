# Raspberry UART转RS485通信封装

*简单实现，先用起来*

## 主机
```js
const { Master } = require("../index");
const master = new Master({ path: "/dev/ttyAMA2", baudRate: 9600 });
!void async function () {
    // 查找总线上的从机
    console.log(await master.getDeviceList());

    // 轮询从机
    let index = 1;
    while (1) {
        index++;
        for (let address of [ 0x01, 0x02, 0x03 ]) {
            const { data } = await master.say(address, "hello " + index);
            console.log("从机" + address + "：" + data);
        }
        await sleep(10);
    }

}();
async function sleep (ms = 1000) {
    return new Promise(r => {
        setTimeout(r, ms);
    });
}
```

## 从机
```js
const { Slave } = require("../index");

const slave = new Slave({ path: "/dev/ttyS0", baudRate: 9600, address: 0x01 });
slave.on("say", (data, reply) => {
    console.log("say:");
    console.log(data);
    reply("我是从机1，现在时间：" + new Date().toLocaleTimeString());
});
```