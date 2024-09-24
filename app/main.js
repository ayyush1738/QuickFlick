const net = require('net');

// In-memory store for key-value pairs and expiry times
const store = {};
const expiryTimes = {};

const server = net.createServer((socket) => {
  console.log('Client connected');

  // Buffer to store partial data
  let buffer = '';

  socket.on('data', (data) => {
    try {
      // Accumulate data in the buffer
      buffer += data.toString();

      // Check if the buffer contains a full command (terminated by \r\n)
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\r\n')) !== -1) {
        // Extract the full command
        const message = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 2);  // Remove the processed command from the buffer

        console.log(`Received from client: ${message}`);  // Log incoming messages

        // Handle PING command
        if (message === 'PING') {
          console.log('Responding with PONG');
          socket.write('+PONG\r\n');  // Send PONG response
        } 
        // Handle ECHO command
        else if (message.toUpperCase().startsWith('ECHO')) {
          const parts = message.split(' ');
          if (parts.length < 2) {
            socket.write('-Error: ECHO requires an argument\r\n');
          } else {
            const reply = message.slice(5);  // Get the message after 'ECHO '
            console.log(`Echoing: ${reply}`);
            socket.write(`+${reply}\r\n`);  // Echo back the message
          }
        } 
        // Handle SET command: SET key value [EX seconds | PX milliseconds]
        else if (message.toUpperCase().startsWith('SET')) {
          const parts = message.split(' ');
          if (parts.length < 3) {
            socket.write('-Error: SET requires a key and value\r\n');
          } else {
            const key = parts[1];
            const value = parts[2];
            store[key] = value;
            socket.write('+OK\r\n');

            // Handle optional expiry with PX (milliseconds)
            if (parts.length >= 5 && parts[3].toUpperCase() === 'PX') {
              const expiryMs = parseInt(parts[4], 10);
              if (isNaN(expiryMs) || expiryMs < 0) {
                socket.write('-Error: Invalid PX value\r\n');
              } else {
                expiryTimes[key] = Date.now() + expiryMs;  // Set expiry time in milliseconds

                // Set timeout to delete the key after the specified time
                setTimeout(() => {
                  delete store[key];
                  delete expiryTimes[key];
                }, expiryMs);
              }
            }
            // Handle optional expiry with EX (seconds)
            else if (parts.length >= 5 && parts[3].toUpperCase() === 'EX') {
              const expirySeconds = parseInt(parts[4], 10);
              if (isNaN(expirySeconds) || expirySeconds < 0) {
                socket.write('-Error: Invalid EX value\r\n');
              } else {
                const expiryMs = expirySeconds * 1000;
                expiryTimes[key] = Date.now() + expiryMs;

                setTimeout(() => {
                  delete store[key];
                  delete expiryTimes[key];
                }, expiryMs);
              }
            }
          }
        } 
        // Handle GET command
        else if (message.toUpperCase().startsWith('GET')) {
          const parts = message.split(' ');
          if (parts.length < 2) {
            socket.write('-Error: GET requires a key\r\n');
          } else {
            const key = parts[1];
            const now = Date.now();

            // Check if the key has expired
            if (expiryTimes[key] && expiryTimes[key] < now) {
              delete store[key];
              delete expiryTimes[key];
              socket.write('$-1\r\n');  // Null response for expired keys
            } else {
              const value = store[key] || null;
              if (value) {
                socket.write(`$${value.length}\r\n${value}\r\n`);
              } else {
                socket.write('$-1\r\n');  // Null response for non-existent keys
              }
            }
          }
        }
        // Unknown command
        else {
          console.log('Unknown command');
          socket.write('-Error: unknown command\r\n');
        }
      }
    } catch (error) {
      console.error('Error while handling data:', error);
      socket.write('-Error: internal server error\r\n');
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

server.listen(6379, () => {
  console.log('Server listening on port 6379');
});
