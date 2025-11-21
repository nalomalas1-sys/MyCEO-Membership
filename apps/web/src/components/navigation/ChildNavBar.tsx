import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Home, BookOpen, Trophy, Building2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

export function ChildNavBar() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('child_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setChildSession(session);
      } catch (err) {
        console.error('Failed to parse child session:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('child_session');
    navigate('/dashboard');
  };

  if (!childSession) {
    return null;
  }

  return (
    <nav className="bg-yellow-400 border-b-4 border-yellow-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/child/dashboard" className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">MyCEO</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                to="/child/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-colors font-medium"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/child/modules"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-colors font-medium"
              >
                <BookOpen className="h-4 w-4" />
                <span>Learn</span>
              </Link>
              <Link
                to="/child/company"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-colors font-medium"
              >
                <Building2 className="h-4 w-4" />
                <span>My Company</span>
              </Link>
              <Link
                to="/child/achievements"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-colors font-medium"
              >
                <Trophy className="h-4 w-4" />
                <span>Achievements</span>
              </Link>
            </div>
          </div>

          {/* Right Side - Child Name and Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-white">
                {childSession.childName} 👋
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors border-2 border-white/30"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


