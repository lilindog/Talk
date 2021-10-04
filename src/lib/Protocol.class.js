"use strict";

/*
|--------------------------------------------------------------|
|  address 1xxxxxxx  | functionCode 0xxxxxxx | length 0xxxxxxx |
|--------------------------------------------------------------|
|             data 0xxxxxx0xxxxxxx0xxxxxxx *length             |
|--------------------------------------------------------------|
|                     check 0xxxxxxx                           |
|--------------------------------------------------------------|
  
1. address      一个字节，最高位永远为1，只用到7位，用于表示地址，范围0-127。
2. functionCode 功能代码，7位有效位，用于区分回复消息和数据消息。   
3. length       表示数据字节长度，7位有效位。   
4. data         数据字节，7位有效位。   
5. check        校验字节，7位有效位。 
*/

const DEBUG_FRAME = false;

const Event = require("events");

class ProtocolData {
    static fields = {
        address: 0, 
        functionCode: 0,
        data: null
    };
    constructor (options) {
        Reflect.ownKeys(ProtocolData.fields).forEach(k => options[k] !== undefined && (this[k] = options[k]));
    }
}

class Protocol extends Event {
    static REPLY_ADDRESS = 0x00;
    static FUNCTION_CODE = {
        STATUS:  0x00, // 状态查询帧，用于查询对方是否在线，回复空帧即可。   
        MESSAGE: 0x01  // 消息帧
    };
    static ProtocolData = ProtocolData;
    buffer = [];
    serial = null;
    constructor (serialport) {
        super();
        this.serial = serialport;
        this.serial.on("data", chunk => {
            this.buffer.push(...chunk);

            if (DEBUG_FRAME) {
                console.log("接收数据 ===========================>");
                console.log("current buffer:");
                console.log(chunk);
                console.log("total buffer：");
                console.log(this.buffer);
                console.log("\n");
            }
            
            this._readFrame();
        });
    }
    async send (address, str) {
        return new Promise((resolve, reject) => {
            const frame = this._buildFrame(address, Protocol.FUNCTION_CODE["MESSAGE"], str);
            this.serial.write(frame, err => {
                err ? reject(err) : resolve();
            });
        });
    }
    async status (address) {
        return new Promise((resolve, reject) => {
            const frame = this._buildFrame(address, Protocol.FUNCTION_CODE["STATUS"]);
            this.serial.write(frame, err => {
                err ? reject(err) : resolve();
            });
        });
    }
    _buildFrame (address, functionCode, str = "") {
        const 
            data = this._string2Bytes(str),
            check = [ address & 0x7f, functionCode & 0x7f, data.length & 0x7f, ...data ].reduce((t, c) => (t ^= c, t), 0);
        const _ =  Buffer.from([ address | 1 << 7, functionCode & 0x7f, data.length & 0x7f, ...data, check & 0x7f ]);

        if (DEBUG_FRAME) {
            console.log("发送数据 ===========================>");
            console.log(_);
            console.log("\n");
        }

        return _;
    }
    _readFrame () {
        let buf = this.buffer;
        while (buf.length) {
            if (buf[0] >> 7) {
                break;
            }
            buf = buf.slice(1);
        }
        if (buf.length < 3) return;
        let 
            address = buf[0] & 0x7f,
            functionCode = buf[1],
            length = buf[2],
            data = buf.slice(3, 3 + length),
            check = buf[3 + length];
        if (check === undefined) return;
        if ([ address, functionCode, length, ...data ].reduce((t, c) => (t ^= c, t), 0) !== check) {
            throw "协议错误！";
        }
        this.buffer = buf.slice(4 + length);
        this.emit("data", new Protocol.ProtocolData({ address, functionCode, data: this._byte2String(data) }));
        this._readFrame();
    }
    _byte2String (bytes = []) {
        if (bytes.length % 3) throw "bytes2String 字节对齐问题！";
        let i, str = "", code;
        for (i = 0; i < bytes.length / 3; i++) {
            code = 
                (bytes[i * 3] << 14) +
                (bytes[i * 3 + 1] << 7) +
                bytes[i * 3 + 2];
            str += String.fromCodePoint(code);
        }
        return str;
    }
    _string2Bytes (str = "") {
        str = String(str);
        return str.split("").reduce((arr, char) => {
            const code = char.codePointAt(0);
            arr.push(code >> 14 & 0x7f, code >> 7 & 0x7f, code & 0x7f);
            return arr;
        }, []);
    }
}

module.exports = Protocol;