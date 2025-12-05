interface LoadingAnimationProps {
  message?: string;
  variant?: 'default' | 'skeleton' | 'minimal';
  skeletonCount?: number;
}

export function LoadingAnimation({ 
  message = 'Loading...', 
  variant = 'default',
  skeletonCount = 8 
}: LoadingAnimationProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-lg text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="py-12">
        <div className="text-center mb-8">
          <p className="text-xl font-bold text-purple-600 mb-2">{message}</p>
          <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(skeletonCount)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-purple-200 animate-pulse"
              style={{
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both, pulse 2s ease-in-out infinite ${index * 0.1 + 0.6}s`
              }}
            >
              <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
              <div className="p-5">
                <div className="h-5 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-3 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2 w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-4 w-1/2 animate-pulse"></div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="h-4 bg-purple-200 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-yellow-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  // Default variant
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-40 h-40 bg-blue-300/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-amber-300/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-300/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-3">
          <h3 className="text-blue-800 font-black text-2xl tracking-tight bg-gradient-to-r from-blue-500 to-amber-500 bg-clip-text text-transparent">
            {message}
          </h3>
          <p className="text-blue-600 font-bold text-sm animate-pulse">
            Please wait while we prepare everything...
          </p>
        </div>
      </div>
    </div>
  );
}

