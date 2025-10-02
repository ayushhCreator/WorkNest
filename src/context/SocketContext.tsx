import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

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
  const { user } = useAuth();

  useEffect(() => {
    // Temporarily disable Socket.IO to prevent resource exhaustion on free tier
    // This can be re-enabled once the app is moved to a paid plan or optimized
    const enableSocketIO = false;
    
    if (user && enableSocketIO) {
      const token = localStorage.getItem('token');
      if (token) {
        // Get the API URL from environment or default to production
        const apiUrl = import.meta.env.VITE_API_URL || 'https://worknest-backend-ald9.onrender.com';
        
        const newSocket = io(apiUrl, {
          auth: { token },
          transports: ['polling'], // Only use polling to reduce resource usage
          upgrade: false, // Disable upgrade to websocket
          timeout: 30000,
          forceNew: false, // Don't force new connections
          reconnection: false // Disable auto-reconnection to prevent spam
        });

        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
          // Disconnect immediately on error to prevent retry spam
          newSocket.disconnect();
        });

        setSocket(newSocket);

        return () => {
          console.log('Cleaning up socket connection');
          newSocket.removeAllListeners();
          newSocket.disconnect();
        };
      }
    }

    // Cleanup function for when user logs out or component unmounts
    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user?.id]); // Only depend on user ID to prevent unnecessary recreations

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
