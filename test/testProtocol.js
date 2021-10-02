"use strict";

const Protocol = require("../lib/Protocol.class");

// 模拟Serialport
const mockSerial = {
    listens: {},
    // 模拟写入函数，为方便测试写入后直接触发data事件，来测试写入和输出
    write (buf, f) {
        this.listens["data"].forEach(cb => {
            cb(buf);
            f(null);
        });
    },
    // 模拟data监听函数
    on (ev, cb) {
        !this.listens[ev] && (this.listens[ev] = []);
        this.listens[ev].push(cb);
    },
    _test1 (buf) {
        this.listens["data"].forEach(cb => {
            cb(buf);
        });
    }
}

const p = new Protocol(mockSerial);
p.on("data", function (data) {
    console.log("data 数据：");
    console.log(data);
});

// 正常数据接收测试
p.send(0x0f, "你好，黎林 hello lilin!");

// 数据帧粘包测试
mockSerial._test1([...p._buildFrame(0x01, "lilin"), ...p._buildFrame(0x02, "zhang")]);

// 数据帧帧分包测试
const 
    frame = p._buildFrame(0x01, "lilin hello 黎林 你好"),
    frame1 = frame.slice(0, frame.byteLength / 2),
    frame2 = frame.slice(frame.length / 2);
console.log("发送第1帧");
mockSerial._test1(frame1);
console.log("发送第2帧");
mockSerial._test1(frame2);
