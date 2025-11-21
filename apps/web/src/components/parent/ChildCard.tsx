import { Child } from '@/types/child';
import { Edit } from 'lucide-react';

interface ChildCardProps {
  child: Child;
  onViewDetails: (childId: string) => void;
  onEdit?: (child: Child) => void;
}

export function ChildCard({ child, onViewDetails, onEdit }: ChildCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={() => onViewDetails(child.id)}
        >
          {child.profile_picture_url ? (
            <img
              src={child.profile_picture_url}
              alt={child.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl">{child.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onViewDetails(child.id)}
        >
          <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
          <p className="text-sm text-gray-600">Age: {child.age || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">Code: {child.access_code}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-primary-600">Level {child.current_level}</div>
          <div className="text-xs text-gray-500">{child.total_xp} XP</div>
          {child.current_streak > 0 && (
            <div className="text-xs text-yellow-600 mt-1">🔥 {child.current_streak} day streak</div>
          )}
        </div>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(child);
            }}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Edit child"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}





