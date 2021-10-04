"use strict";

const 
    Searial = require("serialport"),
    Protocol = require("./Protocol.class");

class Master {
    #protocol;
    #waitTime = 1000;
    #getDeviceListWaitTime = 20;
    isBusy = false;
    constructor ({ path, baudRate }) {
        this.#protocol = new Protocol(new Searial(path, { baudRate }));
    }
    async getDeviceList () {
        if (this.isBusy) throw "总线忙！";
        this.isBusy = true;
        const 
            addressLen   = parseInt("01111111", 2),
            slaveAddress = [];
        for (let i = 1; i < addressLen; i++) {
            if (
                await new Promise(async resolve => {
                    this.#protocol.once("data", resolve.bind(null, true));
                    await this.#protocol.status(i);
                    setTimeout(resolve.bind(null, false), this.#getDeviceListWaitTime);
                })
            ) {
                slaveAddress.push(i);
            }
        }
        this.isBusy = false;
        return slaveAddress;
    }
    async say (address, msg = "") {
        if (this.isBusy) throw "总线忙！";
        this.isBusy = true;
        let resolve, p = new Promise(res => resolve = res);
        this.#protocol.once("data", data => {
            this.isBusy = false;
            resolve(data);
        });
        await this.#protocol.send(address, msg);
        setTimeout(() => {
            this.isBusy = false;
            resolve(false);
        }, this.#waitTime);
        return p;
    }
}

module.exports = Master;