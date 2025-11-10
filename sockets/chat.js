import jwt from 'jsonwebtoken';

export default function initChat(io) {
  // Log engine-level connection errors (helpful for websocket handshake issues)
  try {
    if (io && io.engine) {
      io.engine.on && io.engine.on('connection_error', (err) => {
        console.error('[socket.io] engine connection_error:', err && err.message, err);
      });
    }
  } catch (e) {
    // ignore
  }
  // Socket auth middleware: expects token in socket.handshake.auth.token
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) {
        const header = socket.handshake.headers && socket.handshake.headers.authorization;
        if (header && header.startsWith('Bearer ')) {
          // fallback
          socket.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
          return next();
        }
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      console.error('[socket.io] auth error:', err && err.message, err);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Log socket-level errors
    socket.on('error', (err) => {
      console.error('[socket.io] socket error for', socket.id, err && err.message, err);
    });

    console.log('[socket.io] connected', socket.id, 'user:', socket.user && (socket.user.id || socket.user._id));
    const user = socket.user || {};
    const userId = user.id || user._id || user.userId || 'unknown';

    // Join a personal room so other sockets can emit directly
    socket.join(`user:${userId}`);

    // Allow client to join a chat room for a conversation with another user
    // payload: { otherId }
    socket.on('joinChat', (payload) => {
      try {
        const otherId = payload && payload.otherId;
        if (!otherId) return;
        const room = [String(userId), String(otherId)].sort().join(':');
        socket.join(`chat:${room}`);
        socket.emit('joined', { room: `chat:${room}` });
      } catch (e) {}
    });

    // message payload: { to, text, meta }
    socket.on('message', (payload) => {
      try {
        if (!payload || !payload.to || !payload.text) return;
        const to = String(payload.to);
        const room = [String(userId), to].sort().join(':');
        const message = {
          from: String(userId),
          to,
          text: payload.text,
          meta: payload.meta || {},
          createdAt: new Date().toISOString()
        };

        // Emit to the chat room (both participants)
        io.to(`chat:${room}`).emit('message', message);

        // Also emit to personal room of recipient for convenience
        io.to(`user:${to}`).emit('message', message);
      } catch (e) {
        // silent
      }
    });

    socket.on('disconnect', () => {
      // cleanup if needed
    });
  });
}
