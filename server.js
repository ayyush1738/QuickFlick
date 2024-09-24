const net = require('net');

const server = net.createServer();
const port = 6379;
const host = '127.0.0.1';

server.on('connection', (socket)=>{
    let buffer='';

    socket.on('data', (data)=>{
        buffer+= data.toString();
        if(buffer.includes('\r\n')){
            const reqData = buffer.trim();
            socket.write("res: " + reqData + '\n');
            buffer = '';
        }
    })

    socket.on('end', ()=>{
        console.log('Client disconnected');
    })
})

server.listen(port, host, ()=>{
    console.log(`Server is running on port ${host} ${port}`);
})