/**
 * @author Jinke.Li
 * @email 1359518268@qq.com
 * @create date 2018-04-08 05:43:19
 * @modify date 2018-04-08 05:43:19
 * @desc [description]
*/

const Int64 = require('node-int64')

const createBuffer = (size) => (fnName) => (content, offset = 0) => {
    const BYTE = "BE"
    const _Buffer = Buffer.allocUnsafe(size).fill(0)
    _Buffer[fnName](content, offset)
    return _Buffer
}

//nodejs原生不支持 64位的 借助 node-int64 生成
const create64Buffer = (size = 8) => (value) => {
    const nullBuffer = Buffer.alloc(8)
    const int64 = new Int64(value)
    const buffer_64 = int64.toBuffer()
    buffer_64.copy(nullBuffer, 0)
    return nullBuffer
}

/**
 * 消息头部结构
    4: 总长度
    23: 客户端头
    28: 通用消息头
    4: 消息长度
 *
 * 丑陋版本 摸索出来的版本 待改进
 * @param {Options}
 * @param {Number} options.uid 用户id
 * @param {Number} options.msgId 消息id
 * @return HEADERS
 */

function buildHeaders({ uid, msgId = 30000, msgLength } = options) {
    const version = createBuffer(2)("writeInt16BE")(0)          //版本号
    const sessionId = createBuffer(4)('writeInt32BE')(0)        //会话id
    const tagId = createBuffer(4)('writeInt32BE')(0)            //包序号
    const _uid = create64Buffer(8)(uid)                      //uid             
    const bodyFlag = createBuffer(1)("writeInt8")(0)           //bodyFlag
    const optionLength = createBuffer(4)("writeInt32BE")(0)     //options length
    const timestamp = create64Buffer(8)(0)             //时间戳
    const magicNum = createBuffer(2)("writeInt16BE")(0)               //magic num
    const _msgId = createBuffer(2)("writeInt16BE")(msgId)               //消息id
    const msgType = createBuffer(2)("writeInt16BE")(0)                 //消息类型
    const msgSeq = createBuffer(4)("writeInt32BE")(0)                   //消息序列
    const srcFE = createBuffer(1)("writeInt8")(0)
    const destFE = createBuffer(1)("writeInt8")(1)
    const srcId = createBuffer(4)("writeInt32BE")(0)
    const destId = createBuffer(4)("writeInt32BE")(0)
    const message = Buffer.alloc(4).fill(0)

    const config = [
        { value: version, length: version.length },
        { value: sessionId, length: sessionId.length },
        { value: tagId, length: tagId.length },
        { value: _uid, length: _uid.length },
        { value: bodyFlag, length: bodyFlag.length },
        { value: optionLength, length: optionLength.length },
        { value: timestamp, length: timestamp.length },
        { value: magicNum, length: magicNum.length },
        { value: _msgId, length: _msgId.length },
        { value: msgType, length: msgType.length },
        { value: msgSeq, length: msgSeq.length },
        { value: srcFE, length: srcFE.length },
        { value: destFE, length: destFE.length },
        { value: srcId, length: srcId.length },
        { value: destId, length: destId.length }
    ]

    const totalLength = config.reduce((prev, { length }) => prev += length, 0) + 4 + 4 + msgLength
    const placeHolder = createBuffer(4)("writeInt32BE")(totalLength)
    const msg = createBuffer(4)("writeInt32BE")(msgLength)
    const _buffers_ = config.map(({ value }) => value)
    _buffers_.unshift(placeHolder)
    _buffers_.push(msg)

    const HEADERS = Buffer.concat(_buffers_, totalLength - msgLength)
    return HEADERS
}

const getBuffer = ({ buffer = Buffer.alloc(0), limit = 0 }) => buffer.slice(0,limit)

function concatBuffer(headers,content){
    return Buffer.concat([headers,content],headers.length + content.length)
}


module.exports = {
    createBuffer,
    create64Buffer,
    buildHeaders,
    getBuffer,
    concatBuffer
}