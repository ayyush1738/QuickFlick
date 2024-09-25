const net = require('net');
const logger = require('./logger')("server");
const loggerUtil = require('./logger')("util");

const server = net.createServer();
const port = 6379;
const host = '127.0.0.1';

server.on('connection', (socket)=>{
    loggerUtil.log(`Client is connected`);
    let buffer='';
    socket.write("Welcome To QuickFlickDB\r\n\n");
    socket.on('data', (data)=>{
        buffer+= data.toString();
        if(buffer.includes('\r\n')){
            const reqData = buffer.trim();
            socket.write("res: " + reqData + '\r\n');
            buffer = '';
        }
    })

    socket.on('end', ()=>{
        console.log('Client disconnected');
    })
})

server.listen(port, host, ()=>{
    logger.log(`Server is running on port ${host}:${port}`);
})