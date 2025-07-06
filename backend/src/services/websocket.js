const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

module.exports = (server) => {
  const wss = new WebSocket.Server({ 
    server,
    verifyClient: (info, done) => {
      // Early rejection for missing token
      const { query } = url.parse(info.req.url, true);
      if (!query || !query.token) {
        return done(false, 401, 'Unauthorized - No token provided');
      }
      done(true);
    }
  });

  const clients = new Map();

  wss.on('connection', (ws, req) => {
    try {
      // More robust URL parsing
      const { query } = url.parse(req.url, true);
      const token = query.token;
      
      if (!token) {
        throw new Error('No token provided');
      }

      // Verify token with proper error handling
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Store the connection with user info
      clients.set(decoded.id, {
        ws,
        userId: decoded.id,
        lastActive: Date.now()
      });

      // Heartbeat to detect dead connections
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('close', () => {
        clients.delete(decoded.id);
        // console.log(`Client ${decoded.id} disconnected`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${decoded.id}:`, error);
      });

      ws.on('message', (message) => {
        // Optional: handle incoming messages
        try {
          const data = JSON.parse(message);
          console.log('Received message from', decoded.id, data);
          // Add your message handling logic here
        } catch (parseError) {
          console.error('Error parsing message:', parseError);
        }
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'success',
        message: 'WebSocket connection established'
      }));

    } catch (err) {
      console.error('WebSocket connection error:', err.message);
      
      // Proper WebSocket close codes:
      // - 1008: Policy violation
      // - 4000-4999: Application-specific
      const closeCode = err.name === 'JsonWebTokenError' ? 1008 : 4000;
      ws.close(closeCode, err.message || 'Authentication failed');
    }
  });

  // // Ping all clients periodically to check connection health
  // const interval = setInterval(() => {
  //   wss.clients.forEach((ws) => {
  //     if (ws.isAlive === false) return ws.terminate();
  //     ws.isAlive = false;
  //     ws.ping(null, false, true);
  //   });
  // }, 30000);

  // Cleanup on server shutdown
  wss.on('close', () => {
    clearInterval(interval);
  });

  return {
    sendNotification(userId, message) {
      const client = clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          return true;
        } catch (err) {
          console.error('Error sending notification:', err);
          clients.delete(userId);
          return false;
        }
      }
      return false;
    },
    
    broadcast(message) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    },
    
    getConnectedUsers() {
      return Array.from(clients.keys());
    }
  };
};
