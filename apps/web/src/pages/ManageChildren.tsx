import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useParent, useChildren, useDeletedChildren } from '@/hooks/useParent';
import { AddChildModal } from '@/components/parent/AddChildModal';
import { ChildCard } from '@/components/parent/ChildCard';
import { EditChildModal } from '@/components/parent/EditChildModal';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/child';
import { Users, Plus, Search, Filter, RotateCcw, Trash2 } from 'lucide-react';

function ManageChildrenContent() {
  const navigate = useNavigate();
  const { parent, loading: parentLoading } = useParent();
  const { children, loading: childrenLoading, refetch } = useChildren();
  const { deletedChildren, refetch: refetchDeleted, restoreChild, permanentDeleteChild } = useDeletedChildren();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const handleAddChildSuccess = () => {
    refetch();
    setIsAddChildModalOpen(false);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetch();
    setIsEditModalOpen(false);
    setEditingChild(null);
  };

  const handleDeleteChild = async (childId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this child? They will be permanently deleted after 30 days. You can restore them before then.'
      )
    ) {
      return;
    }

    setDeletingChildId(childId);
    try {
      // Soft delete - set deleted_at timestamp
      const { error } = await supabase
        .from('children')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', childId);

      if (error) throw error;
      refetch();
      refetchDeleted();
    } catch (err: any) {
      alert('Failed to delete child: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingChildId(null);
    }
  };

  const handleRestoreChild = async (childId: string) => {
    const result = await restoreChild(childId);
    if (result.success) {
      refetch();
      refetchDeleted();
    } else {
      alert('Failed to restore child: ' + (result.error || 'Unknown error'));
    }
  };

  const handlePermanentDeleteChild = async (childId: string, childName: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${childName}? This action cannot be undone and all their data will be lost forever.`
      )
    ) {
      return;
    }

    const result = await permanentDeleteChild(childId);
    if (result.success) {
      refetchDeleted();
    } else {
      alert('Failed to permanently delete child: ' + (result.error || 'Unknown error'));
    }
  };

  const handleViewChildDetails = (childId: string) => {
    navigate(`/dashboard/children/${childId}`);
  };

  // Filter and search children
  const filteredChildren = children.filter((child) => {
    const matchesSearch =
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.access_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterLevel === 'all' || child.current_level.toString() === filterLevel;

    return matchesSearch && matchesFilter;
  });

  // Get unique levels for filter
  const availableLevels = Array.from(
    new Set(children.map((child) => child.current_level))
  ).sort((a, b) => a - b);

  if (parentLoading || childrenLoading) {
    return <LoadingAnimation message="Loading children..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ParentNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Children</h1>
                <p className="text-gray-600 mt-1">
                  View and manage all your children's accounts
                </p>
              </div>
            </div>
            {parent && (
              <button
                onClick={() => setIsAddChildModalOpen(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Child</span>
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or access code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Levels</option>
                {availableLevels.map((level) => (
                  <option key={level} value={level.toString()}>
                    Level {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Total Children</div>
              <div className="text-2xl font-bold text-gray-900">{children.length}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Total XP</div>
              <div className="text-2xl font-bold text-primary-600">
                {children.reduce((sum, child) => sum + child.total_xp, 0).toLocaleString()}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Average Level</div>
              <div className="text-2xl font-bold text-primary-600">
                {Math.round(
                  children.reduce((sum, child) => sum + child.current_level, 0) /
                  children.length
                )}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Active Streaks</div>
              <div className="text-2xl font-bold text-primary-600">
                {children.filter((child) => child.current_streak > 0).length}
              </div>
            </div>
          </div>
        )}

        {/* Children List */}
        <div>
          {children.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No children yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first child to begin their learning journey.
              </p>
              {parent && (
                <button
                  onClick={() => setIsAddChildModalOpen(true)}
                  className="btn btn-primary inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Your First Child</span>
                </button>
              )}
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="card text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No children found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterLevel('all');
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredChildren.length} of {children.length} children
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChildren.map((child) => (
                  <div key={child.id} className="relative">
                    <ChildCard
                      child={child}
                      onViewDetails={handleViewChildDetails}
                      onEdit={handleEditChild}
                    />
                    <button
                      onClick={() => handleDeleteChild(child.id)}
                      disabled={deletingChildId === child.id}
                      className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete child"
                    >
                      {deletingChildId === child.id ? '...' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Deleted Children Section */}
        {deletedChildren.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Trash2 className="h-6 w-6 text-gray-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Deleted Children</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    These children will be permanently deleted after 30 days
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deletedChildren.map((child) => {
                const deletedDate = child.deleted_at ? new Date(child.deleted_at) : null;
                const daysUntilPermanent = deletedDate
                  ? Math.ceil((30 - (Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;

                return (
                  <div key={child.id} className="card opacity-75 bg-gray-50 border-gray-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-700 mb-1">{child.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">Access Code: {child.access_code}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Level: {child.current_level}</p>
                          <p>XP: {child.total_xp.toLocaleString()}</p>
                          {deletedDate && (
                            <>
                              <p className="mt-2">Deleted: {deletedDate.toLocaleDateString()}</p>
                              {daysUntilPermanent > 0 && (
                                <p className="text-orange-600 font-semibold">
                                  {daysUntilPermanent} days until permanent deletion
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestoreChild(child.id)}
                        className="flex-1 btn btn-success flex items-center justify-center space-x-2"
                        title="Restore child"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteChild(child.id, child.name)}
                        className="flex-1 btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2"
                        title="Permanently delete child"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Child Modal */}
        {parent && (
          <AddChildModal
            isOpen={isAddChildModalOpen}
            onClose={() => setIsAddChildModalOpen(false)}
            onSuccess={handleAddChildSuccess}
            parentId={parent.id}
          />
        )}

        {/* Edit Child Modal */}
        {editingChild && (
          <EditChildModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingChild(null);
            }}
            onSuccess={handleEditSuccess}
            child={editingChild}
          />
        )}
      </div>
    </div>
  );
}

export default function ManageChildrenPage() {
  return (
    <ProtectedRoute>
      <ManageChildrenContent />
    </ProtectedRoute>
  );
}

