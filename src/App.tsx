import { useState, useEffect } from 'react';
import { InternshipRegistrationForm } from './components/InternshipRegistrationForm';
import { ApplicationsList } from './components/ApplicationsList';
import { AdminLogin } from './components/AdminLogin';
import viuraaLogo from 'figma:asset/b42a712e245a52a2a439ee360f63a35caa881a1e.png';
import viuraaIcon from 'figma:asset/85dc849ce35b1e6d87a4dc33a812e592d2da706c.png';
import welcomeImage from 'figma:asset/811d879e6fe3f1c80779fd6802e814ceac4e8073.png';
import { Users } from 'lucide-react';
import { Toaster } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from './utils/supabase/info';

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/announcement`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch announcement');
      }

      const data = await response.json();
      setAnnouncementText(data.text || '');
    } catch (error) {
      console.error('Error fetching announcement:', error);
      // Don't show error toast on initial load if there's no announcement yet
    }
  };

  const handleAdminClick = () => {
    setShowAdminLogin(true);
  };

  const handleLoginSuccess = () => {
    setShowAdminLogin(false);
    setCurrentView('list');
  };

  const handleCloseLogin = () => {
    setShowAdminLogin(false);
  };

  const handleBackToForm = () => {
    setCurrentView('form');
  };

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #192A39, #1a3545, #1e3f51)' }}>
      {/* Animated liquid background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ 
          background: 'radial-gradient(circle, rgba(239, 157, 101, 0.25) 0%, rgba(239, 157, 101, 0.1) 50%, transparent 100%)',
          animation: 'float 8s ease-in-out infinite, glow 4s ease-in-out infinite alternate'
        }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl" style={{ 
          background: 'radial-gradient(circle, rgba(239, 157, 101, 0.3) 0%, rgba(239, 157, 101, 0.15) 50%, transparent 100%)',
          animation: 'float 10s ease-in-out infinite reverse, glow 6s ease-in-out infinite alternate-reverse'
        }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full blur-3xl" style={{ 
          background: 'radial-gradient(circle, rgba(239, 157, 101, 0.2) 0%, rgba(239, 157, 101, 0.08) 50%, transparent 100%)',
          animation: 'float 12s ease-in-out infinite, pulse 5s ease-in-out infinite'
        }}></div>
        {/* Floating bubbles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl opacity-60" style={{ 
          background: 'radial-gradient(circle, rgba(239, 157, 101, 0.4) 0%, transparent 70%)',
          animation: 'bubble 15s ease-in-out infinite'
        }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full blur-2xl opacity-50" style={{ 
          background: 'radial-gradient(circle, rgba(239, 157, 101, 0.35) 0%, transparent 70%)',
          animation: 'bubble 18s ease-in-out infinite reverse'
        }}></div>
      </div>
      
      {/* Liquid glass overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(239, 157, 101, 0.1) 0%, transparent 50%, rgba(239, 157, 101, 0.1) 100%)',
          animation: 'wave 8s ease-in-out infinite'
        }}></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-2">
          {/* Admin Button - Top Right - Hidden on Applications Dashboard */}
          {currentView === 'form' && (
            <div className="absolute top-0 right-0">
              <button
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition shadow-lg overflow-hidden group"
                style={{
                  background: 'rgba(25, 42, 57, 0.7)',
                  border: '2px solid rgba(239, 157, 101, 0.3)',
                  color: 'white'
                }}
                onClick={handleAdminClick}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{ 
                  background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                  animation: 'buttonShimmer 2s ease-in-out infinite'
                }}></div>
                <Users className="w-5 h-5 relative z-10" />
              </button>
            </div>
          )}

          <div className="inline-block p-4 rounded-xl relative" style={{ 
            border: '2px solid transparent',
            background: 'linear-gradient(#192A39, #192A39) padding-box, linear-gradient(135deg, rgba(239, 157, 101, 0.8), transparent) border-box'
          }}>
            <img 
              src={viuraaIcon} 
              alt="Viuraa Icon" 
              className="w-32 h-32 mx-auto" 
              style={{ filter: 'drop-shadow(0 0 20px rgba(239, 157, 101, 0.8))' }}
            />
          </div>
          <h1 className="text-white text-xl drop-shadow-lg font-bold uppercase relative" style={{ fontFamily: 'Iceberg, sans-serif', textShadow: '0 0 30px rgba(239, 157, 101, 0.5)' }}>
            Internship Kickoff Enrollment
          </h1>
          {announcementText && (
            <div className="mt-4 text-sm text-white bg-gray-800 p-2 rounded-lg inline-block relative overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.7) 0%, rgba(25, 42, 57, 0.4) 100%)', 
              border: '2px solid rgba(239, 157, 101, 0.4)', 
              boxShadow: '0 25px 50px -12px rgba(239, 157, 101, 0.4), inset 0 2px 20px rgba(239, 157, 101, 0.1)' 
            }}>
              <div className="flex items-center justify-center gap-2 mb-1" style={{ color: '#EF9D65' }}>
                <span className="text-lg font-bold">
                  Viuraa Technova Spark Heartly Welcome
                </span>
              </div>
              <div className="text-white text-xl drop-shadow-lg font-bold uppercase" style={{ fontFamily: 'Iceberg, sans-serif', textShadow: '0 0 30px rgba(239, 157, 101, 0.5)' }}>{announcementText}</div>
            </div>
          )}
        </div>
        {currentView === 'form' ? <InternshipRegistrationForm announcementText={announcementText} /> : <ApplicationsList onBack={handleBackToForm} />}
        {showAdminLogin && <AdminLogin onLoginSuccess={handleLoginSuccess} onClose={handleCloseLogin} />}
      </div>
      
      <Toaster position="top-right" richColors />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes glow {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes bubble {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(50px, -100px) scale(1.3); opacity: 0.7; }
        }
        
        @keyframes wave {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-20px) translateY(-20px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes buttonShimmer {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        @keyframes bouquet {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-bouquet {
          animation: bouquet 2s linear infinite;
        }
        
        @keyframes splash-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(-10px, -10px) scale(1.2); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        }
        
        .animate-splash-1 {
          animation: splash-1 2s ease-in-out infinite;
        }
        
        @keyframes splash-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(10px, -10px) scale(1.2); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        }
        
        .animate-splash-2 {
          animation: splash-2 2s ease-in-out infinite;
        }
        
        @keyframes splash-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(-10px, 10px) scale(1.2); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        }
        
        .animate-splash-3 {
          animation: splash-3 2s ease-in-out infinite;
        }
        
        @keyframes splash-4 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(10px, 10px) scale(1.2); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        }
        
        .animate-splash-4 {
          animation: splash-4 2s ease-in-out infinite;
        }
        
        @keyframes glitter {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
        
        @keyframes glitterSplash1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(-10px, -10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes glitterSplash2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(10px, -10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes glitterSplash3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(-10px, 10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes glitterSplash4 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(10px, 10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes glitterSplash5 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(-10px, -10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes glitterSplash6 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(10px, -10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes glitterSplash7 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(-10px, 10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes glitterSplash8 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(10px, 10px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        
        @keyframes sparkle {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(0.5); opacity: 0; }
        }
        
        .animate-sparkle-1 {
          animation: sparkle 2s ease-in-out infinite;
        }
        
        .animate-sparkle-2 {
          animation: sparkle 2.5s ease-in-out infinite;
        }
        
        .animate-sparkle-3 {
          animation: sparkle 3s ease-in-out infinite;
        }
        
        .animate-sparkle-4 {
          animation: sparkle 3.5s ease-in-out infinite;
        }
        
        .animate-sparkle-5 {
          animation: sparkle 4s ease-in-out infinite;
        }
        
        .animate-sparkle-6 {
          animation: sparkle 4.5s ease-in-out infinite;
        }
        
        .animate-sparkle-7 {
          animation: sparkle 5s ease-in-out infinite;
        }
        
        .animate-sparkle-8 {
          animation: sparkle 5.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}