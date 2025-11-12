// import jwt from 'jsonwebtoken';

// export default function initChat(io) {
//   // Log engine-level connection errors (helpful for websocket handshake issues)
//   try {
//     if (io && io.engine) {
//       io.engine.on && io.engine.on('connection_error', (err) => {
//         console.error('[socket.io] engine connection_error:', err && err.message, err);
//       });
//     }
//   } catch (e) {
//     // ignore
//   }
//   // Socket auth middleware: expects token in socket.handshake.auth.token
//   io.use((socket, next) => {
//     try {
//       const token = socket.handshake.auth && socket.handshake.auth.token;
//       if (!token) {
//         const header = socket.handshake.headers && socket.handshake.headers.authorization;
//         if (header && header.startsWith('Bearer ')) {
//           // fallback
//           socket.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
//           return next();
//         }
//         return next(new Error('Authentication error: No token'));
//       }

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       socket.user = decoded;
//       return next();
//     } catch (err) {
//       console.error('[socket.io] auth error:', err && err.message, err);
//       return next(new Error('Authentication error: Invalid token'));
//     }
//   });

//   io.on('connection', (socket) => {
//     // Log socket-level errors
//     socket.on('error', (err) => {
//       console.error('[socket.io] socket error for', socket.id, err && err.message, err);
//     });

//     console.log('[socket.io] connected', socket.id, 'user:', socket.user && (socket.user.id || socket.user._id));
//     const user = socket.user || {};
//     const userId = user.id || user._id || user.userId || 'unknown';

//     // Join a personal room so other sockets can emit directly
//     socket.join(`user:${userId}`);

//     // Allow client to join a chat room for a conversation with another user
//     // payload: { otherId }
//     socket.on('joinChat', (payload) => {
//       try {
//         const otherId = payload && payload.otherId;
//         if (!otherId) return;
//         const room = [String(userId), String(otherId)].sort().join(':');
//         socket.join(`chat:${room}`);
//         socket.emit('joined', { room: `chat:${room}` });
//       } catch (e) {}
//     });

//     // message payload: { to, text, meta }
//     socket.on('message', (payload) => {
//       try {
//         if (!payload || !payload.to || !payload.text) return;
//         const to = String(payload.to);
//         const room = [String(userId), to].sort().join(':');
//         const message = {
//           from: String(userId),
//           to,
//           text: payload.text,
//           meta: payload.meta || {},
//           createdAt: new Date().toISOString()
//         };

//         // Emit to the chat room (both participants)
//         io.to(`chat:${room}`).emit('message', message);

//         // Also emit to personal room of recipient for convenience
//         io.to(`user:${to}`).emit('message', message);
//       } catch (e) {
//         // silent
//       }
//     });

//     socket.on('disconnect', () => {
//       // cleanup if needed
//     });
//   });
// }




///>>>>>>>>>>>>>New Testing Api <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

import jwt from 'jsonwebtoken';

// Track active calls and media shares
const activeCalls = new Map(); // userId -> { callId, otherId, status }
const mediaShares = new Map(); // userId -> { mediaId, otherId, type, status }

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

    // Video Call Events
    // Initiate a video call
    socket.on('initiateCall', (payload) => {
      try {
        const { to, callId } = payload;
        if (!to || !callId) return;
        
        const callData = {
          callId,
          from: String(userId),
          to: String(to),
          status: 'ringing',
          initiatedAt: new Date().toISOString()
        };
        
        activeCalls.set(userId, { callId, otherId: to, status: 'initiating' });
        
        // Send call invitation to recipient
        io.to(`user:${to}`).emit('callIncoming', callData);
        console.log(`[call] ${userId} initiated call to ${to} with ID ${callId}`);
      } catch (e) {
        console.error('[call] initiateCall error:', e);
      }
    });

    // Accept a video call
    socket.on('acceptCall', (payload) => {
      try {
        const { callId, from } = payload;
        if (!callId || !from) return;
        
        activeCalls.set(userId, { callId, otherId: from, status: 'accepted' });
        
        io.to(`user:${from}`).emit('callAccepted', { 
          callId, 
          acceptedBy: String(userId),
          acceptedAt: new Date().toISOString()
        });
        console.log(`[call] ${userId} accepted call ${callId} from ${from}`);
      } catch (e) {
        console.error('[call] acceptCall error:', e);
      }
    });

    // Reject/decline a video call
    socket.on('rejectCall', (payload) => {
      try {
        const { callId, from } = payload;
        if (!callId || !from) return;
        
        activeCalls.delete(userId);
        
        io.to(`user:${from}`).emit('callRejected', { 
          callId, 
          rejectedBy: String(userId),
          rejectedAt: new Date().toISOString()
        });
        console.log(`[call] ${userId} rejected call ${callId} from ${from}`);
      } catch (e) {
        console.error('[call] rejectCall error:', e);
      }
    });

    // End/terminate a video call
    socket.on('endCall', (payload) => {
      try {
        const { callId, to } = payload;
        if (!callId || !to) return;
        
        activeCalls.delete(userId);
        
        io.to(`user:${to}`).emit('callEnded', { 
          callId, 
          endedBy: String(userId),
          endedAt: new Date().toISOString()
        });
        console.log(`[call] ${userId} ended call ${callId}`);
      } catch (e) {
        console.error('[call] endCall error:', e);
      }
    });

    // ICE candidates for WebRTC
    socket.on('iceCandidate', (payload) => {
      try {
        const { to, candidate, callId } = payload;
        if (!to || !candidate) return;
        
        io.to(`user:${to}`).emit('iceCandidate', {
          from: String(userId),
          candidate,
          callId
        });
      } catch (e) {
        console.error('[call] iceCandidate error:', e);
      }
    });

    // WebRTC offer
    socket.on('offer', (payload) => {
      try {
        const { to, offer, callId } = payload;
        if (!to || !offer) return;
        
        io.to(`user:${to}`).emit('offer', {
          from: String(userId),
          offer,
          callId
        });
      } catch (e) {
        console.error('[call] offer error:', e);
      }
    });

    // WebRTC answer
    socket.on('answer', (payload) => {
      try {
        const { to, answer, callId } = payload;
        if (!to || !answer) return;
        
        io.to(`user:${to}`).emit('answer', {
          from: String(userId),
          answer,
          callId
        });
      } catch (e) {
        console.error('[call] answer error:', e);
      }
    });

    // Media Share Events
    // Start sharing media (screen, camera, file)
    socket.on('startMediaShare', (payload) => {
      try {
        const { to, mediaId, type, metadata } = payload;
        if (!to || !mediaId || !type) return;
        
        const shareData = {
          mediaId,
          from: String(userId),
          to: String(to),
          type, // 'screen', 'camera', 'file'
          metadata: metadata || {},
          startedAt: new Date().toISOString(),
          status: 'active'
        };
        
        mediaShares.set(userId, { mediaId, otherId: to, type, status: 'sharing' });
        
        io.to(`user:${to}`).emit('mediaShareStarted', shareData);
        console.log(`[media] ${userId} started sharing ${type} (${mediaId}) with ${to}`);
      } catch (e) {
        console.error('[media] startMediaShare error:', e);
      }
    });

    // Stream media data (chunks)
    socket.on('mediaStreamChunk', (payload) => {
      try {
        const { to, mediaId, chunk, chunkIndex, totalChunks } = payload;
        if (!to || !mediaId || !chunk) return;
        
        io.to(`user:${to}`).emit('mediaStreamChunk', {
          from: String(userId),
          mediaId,
          chunk,
          chunkIndex,
          totalChunks
        });
      } catch (e) {
        console.error('[media] mediaStreamChunk error:', e);
      }
    });

    // Stop sharing media
    socket.on('stopMediaShare', (payload) => {
      try {
        const { to, mediaId } = payload;
        if (!to || !mediaId) return;
        
        mediaShares.delete(userId);
        
        io.to(`user:${to}`).emit('mediaShareStopped', {
          from: String(userId),
          mediaId,
          stoppedAt: new Date().toISOString()
        });
        console.log(`[media] ${userId} stopped sharing media ${mediaId}`);
      } catch (e) {
        console.error('[media] stopMediaShare error:', e);
      }
    });

    // Upload/share file metadata
    socket.on('shareFile', (payload) => {
      try {
        const { to, fileId, fileName, fileSize, mimeType, fileData } = payload;
        if (!to || !fileId || !fileName) return;
        
        const fileShare = {
          fileId,
          from: String(userId),
          to: String(to),
          fileName,
          fileSize,
          mimeType,
          sharedAt: new Date().toISOString(),
          fileData: fileData || null // Can be null if sent in chunks
        };
        
        io.to(`user:${to}`).emit('fileShared', fileShare);
        console.log(`[file] ${userId} shared file ${fileName} (${fileId}) with ${to}`);
      } catch (e) {
        console.error('[file] shareFile error:', e);
      }
    });

    // Typing indicator
    socket.on('typing', (payload) => {
      try {
        const { to, isTyping } = payload;
        if (to === undefined || isTyping === undefined) return;
        
        io.to(`user:${to}`).emit('userTyping', {
          from: String(userId),
          isTyping
        });
      } catch (e) {
        // silent
      }
    });

    socket.on('disconnect', () => {
      // Clean up active calls and media shares
      activeCalls.delete(userId);
      mediaShares.delete(userId);
      console.log(`[socket.io] disconnected ${socket.id} (user: ${userId})`);
    });
  });
}
