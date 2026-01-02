import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let newSocket: Socket | null = null;

    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://worknest-backend-ald9.onrender.com';
        newSocket = io(apiUrl, {
          auth: { token },
          transports: ['polling', 'websocket'],
          upgrade: true,
          timeout: 30000,
          forceNew: false,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000
        });

        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket!.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
          newSocket!.disconnect();
        });

        setSocket(newSocket);
      }
    } else {
      // If user is null, disconnect any existing socket
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }

    // Cleanup function
    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection');
        newSocket.removeAllListeners();
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
