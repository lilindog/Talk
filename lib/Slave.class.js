"use strict";

const 
    Serial = require("serialport"),
    Event  = require("events"),
    Protocol = require("./Protocol.class");

class Slave extends Event {
    #protocol;
    address;
    constructor ({ path, baudRate, address }) {
        super();
        this.address = address;
        this.#protocol = new Protocol(new Serial(path, { baudRate }));
        this.#protocol.on("data", ({ address, functionCode, data }) => {
            if (address !== this.address) return;
            if (functionCode === 0x00) {
                this.#protocol.send(Protocol.REPLY_ADDRESS);
            } 
            else if (functionCode === 0x01) {
                this.emit("say", data, this._reply.bind(this));
            }
        });
    }
    _reply (data) {
        this.#protocol.send(Protocol.REPLY_ADDRESS, data);
    }
}

module.exports = Slave;