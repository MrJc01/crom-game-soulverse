import { io, Socket } from 'socket.io-client';

// Helper to ensure we connect to the right URL
// In dev, assuming server is on localhost:3001
const SERVER_URL = 'http://localhost:3001';

export let socket: Socket;

export const initSocketConnection = () => {
  if (socket) return socket; // Return existing instance

  console.log('Initializing Socket Connection...');
  
  socket = io(SERVER_URL, {
    transports: ['websocket'], // Force websocket to avoid polling issues
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('[Client] Connected with ID:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('[Client] Disconnected from server');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};