import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

// Initialize socket lazily
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false, // Don't connect until requested (e.g. after login)
      transports: ['websocket'],
    });
  }
  return socket;
};

export const connectSocket = (deviceId?: string) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      console.log('Socket connected successfully to server.');
      if (deviceId) {
        s.emit('subscribe_device', deviceId);
      }
    });
  } else if (deviceId) {
    s.emit('subscribe_device', deviceId);
  }
};

export const disconnectSocket = (deviceId?: string) => {
  if (socket) {
    if (deviceId) {
      socket.emit('unsubscribe_device', deviceId);
    }
    socket.disconnect();
    socket = null;
    console.log('Socket connection terminated.');
  }
};
