import React from 'react';

interface LoadingAnimationProps {
  message?: string;
  variant?: 'fullscreen' | 'inline' | 'modal';
  showSkeleton?: boolean;
  skeletonCount?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = 'Loading...',
  variant = 'inline',
  showSkeleton = false,
  skeletonCount = 8,
}) => {
  const bouncingDots = (
    <div className="flex justify-center items-center space-x-2 mb-4">
      <div
        className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      ></div>
      <div
        className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      ></div>
      <div
        className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      ></div>
    </div>
  );

  const skeletonCards = showSkeleton ? (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
      {[...Array(skeletonCount)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-purple-200 animate-pulse"
          style={{
            animation: `slideInUp 0.6s ease-out ${index * 0.1}s both, pulse 2s ease-in-out infinite ${index * 0.1 + 0.6}s`,
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
  ) : null;

  const content = (
    <>
      <div className="text-center">
        <p className="text-xl font-bold text-purple-600 mb-2">{message}</p>
        {bouncingDots}
      </div>
      {skeletonCards}
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
    </>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-pink-50 flex items-center justify-center">
        <div className="py-12">{content}</div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="text-center">{content}</div>
      </div>
    );
  }

  // inline variant
  return <div className="py-12">{content}</div>;
};







