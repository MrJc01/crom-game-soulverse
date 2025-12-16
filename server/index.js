const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Enable CORS for development (Frontend usually on port 5173 or 3000)
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev simplicity
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// --- SERVER STATE ---
// In-memory storage for connected players.
// Structure: { [socketId]: { id, x, y, z, color, facingRight } }
let players = {};

io.on('connection', (socket) => {
  console.log(`[SoulVerse] New Connection: ${socket.id}`);

  // 1. Create New Player State
  // Assign a random color for visual distinction
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    z: 0,
    facingRight: true,
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  };

  // 2. Send existing world state to the new player
  socket.emit('currentPlayers', players);

  // 3. Broadcast new player presence to everyone else
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // 4. Handle Movement Updates
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].facingRight = movementData.facingRight;
      
      // Broadcast to everyone else (excluding sender)
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // 5. Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`[SoulVerse] Disconnected: ${socket.id}`);
    // Remove from state
    delete players[socket.id];
    // Notify others
    io.emit('playerDisconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`\n>>> SoulVerse Game Server running on port ${PORT} <<<\n`);
});