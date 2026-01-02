import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/axios';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userParam = searchParams.get('user');

        if (!accessToken || !userParam) {
          throw new Error('Missing authentication data');
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store tokens
        localStorage.setItem('token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        setStatus('success');

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
          // Force page reload to update auth context
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
      >
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Completing Sign In...
            </h2>
            <p className="text-gray-500">
              Please wait while we authenticate your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h2>
            <p className="text-gray-500">
              Authentication successful. Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <div className="bg-red-100 rounded-full p-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-500">
              Redirecting to login page...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;
