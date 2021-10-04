"use strict";

/**
 * 基于uart的树莓派RS485通信协议自定义实现
 * 确保在半双工的情况下实现了主从通信的基本功能
 */

const 
    Master = require("./lib/Master.class"),
    Slave = require("./lib/Slave.class");

module.exports = Object.create(null, {
    Master: {
        value: Master
    },
    Slave: {
        value: Slave
    }
});