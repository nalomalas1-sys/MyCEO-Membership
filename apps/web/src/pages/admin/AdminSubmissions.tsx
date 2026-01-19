import { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import {
    FileDown,
    Search,
    Filter,
    ExternalLink,
    User,
    FileText,
    Calendar,
    BookOpen,
    RefreshCw,
} from 'lucide-react';

interface Submission {
    id: string;
    child_id: string;
    child_name: string;
    module_id: string;
    module_title: string;
    file_url: string;
    file_name: string;
    file_size: number | null;
    mime_type: string | null;
    notes: string | null;
    submitted_at: string;
    signed_url?: string;
}

interface Module {
    id: string;
    title: string;
    track: string;
}

function AdminSubmissionsContent() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchModules();
        fetchSubmissions();
    }, []);

    async function fetchModules() {
        try {
            const { data, error } = await supabase
                .from('modules')
                .select('id, title, track')
                .eq('track', 'project_based')
                .order('title');

            if (error) throw error;
            setModules(data || []);
        } catch (err) {
            console.error('Failed to fetch modules:', err);
        }
    }

    async function fetchSubmissions() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('track_submissions')
                .select(`
          id,
          child_id,
          module_id,
          file_url,
          file_name,
          file_size,
          mime_type,
          notes,
          submitted_at
        `)
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            // Fetch child names, module titles, and generate signed URLs
            const submissionsWithDetails = await Promise.all(
                (data || []).map(async (sub) => {
                    // Get child name
                    const { data: childData } = await supabase
                        .from('children')
                        .select('name')
                        .eq('id', sub.child_id)
                        .single();

                    // Get module title
                    const { data: moduleData } = await supabase
                        .from('modules')
                        .select('title')
                        .eq('id', sub.module_id)
                        .single();

                    // Generate signed URL for the file (valid for 1 hour)
                    let signedUrl = sub.file_url;
                    if (sub.file_url && !sub.file_url.startsWith('http')) {
                        const { data: urlData } = await supabase.storage
                            .from('track-submissions')
                            .createSignedUrl(sub.file_url, 3600);
                        signedUrl = urlData?.signedUrl || sub.file_url;
                    }

                    return {
                        ...sub,
                        child_name: childData?.name || 'Unknown',
                        module_title: moduleData?.title || 'Unknown Module',
                        signed_url: signedUrl,
                    };
                })
            );

            setSubmissions(submissionsWithDetails);
        } catch (err) {
            console.error('Failed to fetch submissions:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleRefresh() {
        setRefreshing(true);
        await fetchSubmissions();
        setRefreshing(false);
    }

    // Filter submissions based on selected module and search query
    const filteredSubmissions = useMemo(() => {
        return submissions.filter((sub) => {
            const matchesModule = selectedModule === 'all' || sub.module_id === selectedModule;
            const matchesSearch = searchQuery === '' ||
                sub.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.module_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.file_name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesModule && matchesSearch;
        });
    }, [submissions, selectedModule, searchQuery]);

    if (loading) {
        return <LoadingAnimation message="Loading submissions..." variant="fullscreen" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            <AdminNavBar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <FileDown className="h-8 w-8 text-blue-500" />
                                Student Submissions
                            </h1>
                            <p className="text-gray-600 mt-2">
                                View all project submissions from students across all modules
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by student, module, or file name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                        </div>

                        {/* Module Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white min-w-[200px]"
                            >
                                <option value="all">All Modules</option>
                                {modules.map((module) => (
                                    <option key={module.id} value={module.id}>
                                        {module.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                        <span>
                            Showing <strong>{filteredSubmissions.length}</strong> of <strong>{submissions.length}</strong> submissions
                        </span>
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {filteredSubmissions.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <FileDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No submissions found</p>
                            <p className="text-sm mt-1">
                                {submissions.length === 0
                                    ? 'No students have submitted projects yet.'
                                    : 'Try adjusting your search or filter criteria.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Student
                                            </div>
                                        </th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Module
                                            </div>
                                        </th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                File
                                            </div>
                                        </th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Submitted
                                            </div>
                                        </th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Notes</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSubmissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                        {sub.child_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{sub.child_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                                    <BookOpen className="h-3 w-3" />
                                                    {sub.module_title}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]" title={sub.file_name}>
                                                        {sub.file_name}
                                                    </span>
                                                    {sub.file_size && (
                                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                                            ({(sub.file_size / 1024).toFixed(1)} KB)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">
                                                <div className="flex flex-col">
                                                    <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">
                                                {sub.notes ? (
                                                    <span className="truncate max-w-[150px] block" title={sub.notes}>
                                                        {sub.notes}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <a
                                                    href={sub.signed_url || sub.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    View File
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminSubmissionsPage() {
    return (
        <ProtectedRoute requireRole="admin">
            <AdminSubmissionsContent />
        </ProtectedRoute>
    );
}
