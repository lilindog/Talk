"use strict";

/*
|----------------------------------------------------------|
| header |  address | functionCode | length | data | check | 
|----------------------------------------------------------|

1. header 帧头部，3个字节，内容为oxff，用于辨识帧开头。  
2. address 一个字节，只用到7位，用于表示地址，范围0-127。
3. functionCode 功能代码，占一个字节，用于区分回复消息和数据消息。   
4. length 数据字节长度。   
5. data 数据字节，长度不定。   
6. check 校验字节，由前面的address开始带数据最后一字节异或运算得来。 
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
            check = [ address, functionCode, data.length, ...data ].reduce((t, c) => (t ^= c, t), 0);
        const _ =  Buffer.from([ 0xff, 0xff, 0xff, address, functionCode, data.length, ...data, check ]);

        if (DEBUG_FRAME) {
            console.log("发送数据 ===========================>");
            console.log(_);
            console.log("\n");
        }

        return _;
    }
    _readFrame () {
        let buf = this.buffer;
        while (1) {
            if (buf.length < 6) return;
            if ((buf[0] << 16) + (buf[1] << 8) + buf[2] === (0xff << 16) + (0xff << 8) + 0xff) {
                buf = buf.slice(3);
                break;
            }
            buf = buf.slice(3);
        }
        let 
            address = buf[0],
            functionCode = buf[1],
            length = buf[2],
            data = buf.slice(3, 3 + length),
            check = buf[3 + length];
        if (check === undefined) return;
        if ([ address, functionCode, length, ...data ].reduce((t, c) => (t ^= c, t), 0) !== check) {
            throw "协议错误！";
        }
        this.buffer = this.buffer.slice(7 + length);
        this.emit("data", new Protocol.ProtocolData({ address, functionCode, data: this._byte2String(data) }));
        this._readFrame();
    }
    _byte2String (bytes = []) {
        let i, str = "";
        for (i = 0; i < bytes.length / 2; i++) {
            str += String.fromCodePoint((bytes[i * 2] << 8) + bytes[i * 2 + 1]);
        }
        return str;
    }
    _string2Bytes (str = "") {
        return str.split("").reduce((t, c, i) => {
            t.push(c.codePointAt(0) >> 8, c.codePointAt(0) & 0xff);
            return t;
        }, []);
    }
}

module.exports = Protocol;