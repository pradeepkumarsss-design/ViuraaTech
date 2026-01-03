import { useState } from 'react';
import { Lock, User, Eye, EyeOff, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

export function AdminLogin({ onLoginSuccess, onClose }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/admin-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Login successful!');
        onLoginSuccess();
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(25, 42, 57, 0.95)' }}>
      {/* Background blur overlay */}
      <div className="absolute inset-0 backdrop-blur-md"></div>
      
      {/* Login Modal */}
      <div className="relative max-w-md w-full rounded-2xl shadow-2xl overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.95) 0%, rgba(25, 42, 57, 0.85) 100%)',
        border: '2px solid rgba(239, 157, 101, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(239, 157, 101, 0.4)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-all hover:bg-white/10"
          style={{ color: '#EF9D65' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ 
            background: 'linear-gradient(135deg, #EF9D65, #F5B17C)',
            boxShadow: '0 10px 25px -5px rgba(239, 157, 101, 0.5)'
          }}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white text-2xl mb-2">Admin Login</h2>
          <p className="text-gray-300 text-sm">Enter your credentials to access the dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {/* Username Field */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm mb-2">Username</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'rgba(25, 42, 57, 0.6)',
                  border: '2px solid rgba(239, 157, 101, 0.3)',
                  color: 'white',
                  focusRingColor: '#EF9D65'
                }}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'rgba(25, 42, 57, 0.6)',
                  border: '2px solid rgba(239, 157, 101, 0.3)',
                  color: 'white',
                  focusRingColor: '#EF9D65'
                }}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            style={{ 
              background: 'linear-gradient(to right, #EF9D65, #F5B17C)',
              color: 'white'
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{ 
              background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
            }}></div>
            <span className="relative z-10">
              {isLoading ? 'Logging in...' : 'Login'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
