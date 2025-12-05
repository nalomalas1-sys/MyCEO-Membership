import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { useModules, Module } from '@/hooks/useModules';
import { supabase } from '@/lib/supabase';
import { BookOpen, Clock, Target, Zap, CheckCircle, Lock, PlayCircle, Star, Award, TrendingUp, Sparkles, BookMarked } from 'lucide-react';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface ModuleProgress {
  status: 'completed' | 'in_progress' | 'not_started';
  progress_percentage: number;
  last_accessed_at: string;
}

interface ExtendedModule extends Module {
  estimated_duration?: string;
}

// Animated Background for Modules
const ModulesBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {/* Animated gradient orbs */}
    <div className="absolute top-10 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
    <div className="absolute bottom-10 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
    <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-300"></div>
    
    {/* Floating books */}
    <div className="absolute top-16 left-1/4 animate-float">
      <div className="w-10 h-12 bg-blue-300 rounded-lg flex items-center justify-center shadow-md rotate-12">
        <BookMarked className="w-5 h-5 text-blue-600" />
      </div>
    </div>
    
    <div className="absolute bottom-20 left-1/3 animate-float-delay">
      <div className="w-8 h-10 bg-purple-300 rounded-lg flex items-center justify-center shadow-md -rotate-12">
        <BookMarked className="w-4 h-4 text-purple-600" />
      </div>
    </div>
    
    <div className="absolute top-1/2 right-1/3 animate-float-slow">
      <div className="w-9 h-11 bg-pink-300 rounded-lg flex items-center justify-center shadow-md rotate-6">
        <BookMarked className="w-4.5 h-4.5 text-pink-600" />
      </div>
    </div>
    
    {/* Floating stars */}
    <div className="absolute top-24 right-16 animate-bounce-slow">
      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
        <Star className="w-4 h-4 text-yellow-800 fill-yellow-800" />
      </div>
    </div>
    
    <div className="absolute bottom-32 left-16 animate-bounce-slow-delay">
      <div className="w-6 h-6 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full flex items-center justify-center shadow-md">
        <Star className="w-3 h-3 text-yellow-700 fill-yellow-700" />
      </div>
    </div>
    
    {/* Animated XP badges */}
    <div className="absolute top-40 left-10 animate-sparkle">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <Zap className="w-6 h-6 text-white" />
      </div>
    </div>
    
    <div className="absolute bottom-40 right-10 animate-sparkle-delay">
      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

export default function ModulesPage() {
  const { modules, loading } = useModules();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [childProgress, setChildProgress] = useState<Record<string, ModuleProgress>>({});
  const [childLoading, setChildLoading] = useState(true);
  const navigate = useNavigate();

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(var(--start-rotate, 0deg)); }
        50% { transform: translateY(-15px) rotate(calc(var(--start-rotate, 0deg) + 180deg)); }
      }
      
      @keyframes float-delay {
        0%, 100% { transform: translateY(0) rotate(var(--start-rotate, 0deg)); }
        50% { transform: translateY(-12px) rotate(calc(var(--start-rotate, 0deg) - 180deg)); }
      }
      
      @keyframes float-slow {
        0%, 100% { transform: translateY(0) rotate(var(--start-rotate, 0deg)); }
        50% { transform: translateY(-8px) rotate(calc(var(--start-rotate, 0deg) + 90deg)); }
      }
      
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes bounce-slow-delay {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      
      @keyframes sparkle {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      
      @keyframes sparkle-delay {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
        50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
      }
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      
      .animate-float-delay {
        animation: float 7s ease-in-out infinite 1s;
      }
      
      .animate-float-slow {
        animation: float 8s ease-in-out infinite 2s;
      }
      
      .animate-bounce-slow {
        animation: bounce-slow 3s ease-in-out infinite;
      }
      
      .animate-bounce-slow-delay {
        animation: bounce-slow 3.5s ease-in-out infinite 0.5s;
      }
      
      .animate-sparkle {
        animation: sparkle 2s ease-in-out infinite;
      }
      
      .animate-sparkle-delay {
        animation: sparkle 2.5s ease-in-out infinite 0.5s;
      }
      
      .animate-pulse-glow {
        animation: pulse-glow 2s ease-in-out infinite;
      }
      
      .hover-glow:hover {
        box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
        transition: box-shadow 0.3s ease;
      }
      
      .card-enter {
        animation: cardEnter 0.6s ease-out;
      }
      
      @keyframes cardEnter {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .progress-bar-glow {
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        background-size: 200% 100%;
        animation: progressGlow 2s ease-in-out infinite;
      }
      
      @keyframes progressGlow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      console.log('No child session found in Modules, redirecting to login');
      navigate('/child/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      setChildSession(session);
    } catch (err) {
      console.error('Failed to parse child session:', err);
      navigate('/child/login');
    } finally {
      setChildLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!childSession?.childId) {
      return;
    }

    async function fetchProgress() {
      try {
        const { data } = await supabase
          .from('child_module_progress')
          .select('*')
          .eq('child_id', childSession.childId);

        if (data) {
          const progressMap: Record<string, ModuleProgress> = {};
          data.forEach((p) => {
            progressMap[p.module_id] = p;
          });
          setChildProgress(progressMap);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    }

    fetchProgress();
  }, [childSession]);

  const getTrackColor = (track: string) => {
    switch (track) {
      case 'money_basics':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          gradient: 'from-blue-500 to-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'entrepreneurship':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          gradient: 'from-purple-500 to-pink-500',
          badge: 'bg-purple-100 text-purple-800'
        };
      case 'advanced':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          gradient: 'from-orange-500 to-red-500',
          badge: 'bg-orange-100 text-orange-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          gradient: 'from-gray-500 to-gray-600',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getTrackName = (track: string) => {
    switch (track) {
      case 'money_basics':
        return 'Money Basics';
      case 'entrepreneurship':
        return 'Entrepreneurship';
      case 'advanced':
        return 'Advanced';
      default:
        return track;
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < difficulty ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusBadge = (module: ExtendedModule) => {
    const progress = childProgress[module.id];
    const trackColors = getTrackColor(module.track);

    if (!progress || progress.status === 'not_started') {
      return (
        <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-medium text-sm flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Not Started
        </div>
      );
    }

    switch (progress.status) {
      case 'completed':
        return (
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm flex items-center gap-2 animate-pulse-glow">
            <CheckCircle className="w-4 h-4" />
            Completed
          </div>
        );
      case 'in_progress':
        return (
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            {progress.progress_percentage}% Complete
          </div>
        );
      default:
        return (
          <div className={`px-3 py-1.5 rounded-lg ${trackColors.badge} font-medium text-sm`}>
            Not Started
          </div>
        );
    }
  };

  if (childLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        <ModulesBackground />
        <div className="text-center relative z-10">
          <div className="inline-block animate-bounce mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">
            Loading Modules...
          </div>
          <div className="text-gray-600">
            Gathering all your learning adventures!
          </div>
        </div>
      </div>
    );
  }

  if (!childSession) {
    return null;
  }

  const completedCount = Object.values(childProgress).filter(p => p.status === 'completed').length;
  const inProgressCount = Object.values(childProgress).filter(p => p.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 font-sans relative overflow-hidden">
      <ModulesBackground />
      <ChildNavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 card-enter">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg hover-glow transform hover:scale-105 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md animate-bounce-slow">
                {modules.length}
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Learning Modules
              </h1>
              <p className="text-gray-600 text-lg">
                Complete interactive lessons to earn XP and level up!
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group cursor-pointer card-enter" style={{ animationDelay: '0.1s' }}>
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border border-blue-100 group-hover:shadow-xl group-hover:border-blue-200 transition-all duration-300 transform group-hover:-translate-y-2 hover-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-blue-600 font-medium">Modules Available</div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{modules.length}</div>
              <div className="text-sm text-gray-600 mt-2">Total lessons to complete</div>
            </div>
          </div>
          
          <div className="group cursor-pointer card-enter" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 shadow-lg border border-purple-100 group-hover:shadow-xl group-hover:border-purple-200 transition-all duration-300 transform group-hover:-translate-y-2 hover-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-purple-600 font-medium">Completed</div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{completedCount}</div>
              <div className="text-sm text-gray-600 mt-2">Lessons finished</div>
            </div>
          </div>
          
          <div className="group cursor-pointer card-enter" style={{ animationDelay: '0.3s' }}>
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 shadow-lg border border-green-100 group-hover:shadow-xl group-hover:border-green-200 transition-all duration-300 transform group-hover:-translate-y-2 hover-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-green-600 font-medium">In Progress</div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <PlayCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{inProgressCount}</div>
              <div className="text-sm text-gray-600 mt-2">Lessons currently learning</div>
            </div>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center shadow-2xl border border-white/20 card-enter hover:shadow-2xl transition-all duration-300 hover-glow">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse-glow">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No Modules Yet!</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto mb-8">
              Learning modules are coming soon! Check back later for interactive lessons about money and business.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(modules as ExtendedModule[]).map((module, index) => {
              const trackColors = getTrackColor(module.track);
              const progress = childProgress[module.id];
              const isCompleted = progress?.status === 'completed';
              const isInProgress = progress?.status === 'in_progress';

              return (
                <div
                  key={module.id}
                  className="group cursor-pointer card-enter"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/child/modules/${module.id}`)}
                >
                  <div className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border ${trackColors.border} shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-3 hover-glow`}>
                    {/* Header with gradient */}
                    <div className={`bg-gradient-to-r ${trackColors.gradient} p-6 relative overflow-hidden`}>
                      <div className="absolute top-2 right-2 opacity-10">
                        <BookOpen className="h-16 w-16 text-white" />
                      </div>
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white/90 text-gray-800 backdrop-blur-sm">
                          {getTrackName(module.track)}
                        </span>
                        {getStatusBadge(module)}
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                        {module.title}
                      </h3>
                      <p className="text-white/90 text-sm line-clamp-2 relative z-10">
                        {module.description || 'Learn valuable skills about money and business!'}
                      </p>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      {/* Difficulty and XP */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-2">Difficulty</div>
                          <div className="flex items-center gap-1">
                            {getDifficultyStars(module.difficulty_level || 3)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-500 mb-2">XP Reward</div>
                          <div className="flex items-center gap-2 text-lg font-bold text-yellow-700">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                              <Zap className="w-4 h-4 text-yellow-800" />
                            </div>
                            {module.xp_reward || 100} XP
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {isInProgress && (
                        <div className="mb-6">
                          <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{progress.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full progress-bar-glow rounded-full transition-all duration-1000"
                              style={{ width: `${progress.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Action Button */}
                      <div className={`w-full py-3 rounded-lg font-medium text-center transition-all group-hover:scale-[1.02] shadow-md ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                          : isInProgress
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                            : `bg-gradient-to-r ${trackColors.gradient} text-white hover:opacity-90`
                      }`}>
                        {isCompleted ? 'Review Lesson' : isInProgress ? 'Continue Lesson' : 'Start Lesson'}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="font-medium">
                          {(module as ExtendedModule).estimated_duration || '15'} min
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Target className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        <span className="font-medium">Level {module.difficulty_level || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Completion Message */}
        {completedCount === modules.length && modules.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200 shadow-lg text-center card-enter hover:shadow-xl transition-all duration-300 hover-glow">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-md animate-bounce-slow">
              🏆
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Amazing! You've Completed All Modules! 🎉</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              You've mastered all the available lessons. Check back soon for new modules or review previous lessons to reinforce your knowledge!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}