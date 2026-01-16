import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Module } from '@/hooks/useModules';
import { Lock, Unlock, Loader2 } from 'lucide-react';

interface ModuleAccessControlProps {
    childId: string;
}

interface LockedModuleRecord {
    module_id: string;
}

export function ModuleAccessControl({ childId }: ModuleAccessControlProps) {
    const [modules, setModules] = useState<Module[]>([]);
    const [lockedModuleIds, setLockedModuleIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [togglingModule, setTogglingModule] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchData();
    }, [childId]);

    const fetchData = async () => {
        try {
            // Fetch all published modules
            const { data: modulesData } = await supabase
                .from('modules')
                .select('*')
                .eq('is_published', true)
                .order('order_index', { ascending: true });

            // Fetch locked modules for this child
            const { data: lockedData } = await supabase
                .from('child_locked_modules')
                .select('module_id')
                .eq('child_id', childId);

            setModules(modulesData || []);
            setLockedModuleIds(new Set((lockedData || []).map((item: LockedModuleRecord) => item.module_id)));
        } catch (err) {
            console.error('Error fetching module access data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLock = async (moduleId: string, isCurrentlyLocked: boolean) => {
        setTogglingModule(moduleId);
        try {
            if (isCurrentlyLocked) {
                // Unlock: delete the record
                const { error } = await supabase
                    .from('child_locked_modules')
                    .delete()
                    .eq('child_id', childId)
                    .eq('module_id', moduleId);

                if (error) throw error;
                setLockedModuleIds(prev => {
                    const next = new Set(prev);
                    next.delete(moduleId);
                    return next;
                });
            } else {
                // Lock: insert a record
                const { error } = await supabase
                    .from('child_locked_modules')
                    .insert({
                        child_id: childId,
                        module_id: moduleId,
                    });

                if (error) throw error;
                setLockedModuleIds(prev => new Set([...prev, moduleId]));
            }
        } catch (err) {
            console.error('Error toggling module lock:', err);
            alert('Failed to update module access. Please try again.');
        } finally {
            setTogglingModule(null);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <Lock className="h-5 w-5 text-gray-500" />
                    <h2 className="text-xl font-semibold">Module Access</h2>
                </div>
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading...</span>
                </div>
            </div>
        );
    }

    if (modules.length === 0) {
        return null;
    }

    const lockedCount = lockedModuleIds.size;
    const displayedModules = expanded ? modules : modules.slice(0, 5);

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-500" />
                    <h2 className="text-xl font-semibold">Module Access</h2>
                </div>
                {lockedCount > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {lockedCount} locked
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Lock modules to temporarily restrict your child's access. Locked modules will still be visible but cannot be opened.
            </p>
            <div className="space-y-2">
                {displayedModules.map((module) => {
                    const isLocked = lockedModuleIds.has(module.id);
                    const isToggling = togglingModule === module.id;

                    return (
                        <div
                            key={module.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${isLocked ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {isLocked ? (
                                    <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                ) : (
                                    <Unlock className="h-4 w-4 text-green-500 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className={`font-medium text-sm truncate ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                                        {module.title}
                                    </p>
                                    <p className="text-xs text-gray-400 capitalize">
                                        {module.track.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleLock(module.id, isLocked)}
                                disabled={isToggling}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${isLocked
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isToggling ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isLocked ? (
                                    <>
                                        <Unlock className="h-3 w-3" />
                                        Unlock
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-3 w-3" />
                                        Lock
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
            {modules.length > 5 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    {expanded ? 'Show less' : `Show all ${modules.length} modules`}
                </button>
            )}
        </div>
    );
}
