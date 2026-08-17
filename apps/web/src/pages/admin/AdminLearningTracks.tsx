import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useLearningTracks, LearningTrack } from '@/hooks/useLearningTracks';
import { THEME_PRESETS, type ThemeKey } from '@/constants/moduleTrackThemes';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const THEME_KEYS: ThemeKey[] = ['gray', 'purple', 'green', 'cyan', 'red', 'indigo'];

function AdminLearningTracksContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tracks, loading, error, refetch } = useLearningTracks();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    icon: '📚',
    theme_key: 'gray' as ThemeKey,
    order_index: 0,
  });

  const resetForm = () => {
    setForm({
      slug: '',
      name: '',
      icon: '📚',
      theme_key: 'gray',
      order_index: tracks.length + 1,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (t: LearningTrack) => {
    setForm({
      slug: t.slug,
      name: t.name,
      icon: t.icon,
      theme_key: (t.theme_key as ThemeKey) || 'gray',
      order_index: t.order_index,
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) {
      toast({ title: 'Error', description: 'Slug and name are required', variant: 'destructive' });
      return;
    }
    const slug = form.slug.trim().toLowerCase().replace(/\s+/g, '_');
    if (!/^[a-z0-9_]+$/.test(slug)) {
      toast({ title: 'Error', description: 'Slug can only contain lowercase letters, numbers, and underscores', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error: err } = await supabase
          .from('learning_tracks')
          .update({
            name: form.name.trim(),
            icon: form.icon.trim() || '📚',
            theme_key: form.theme_key,
            order_index: form.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);
        if (err) throw err;
        toast({ title: 'Success', description: 'Track updated', variant: 'success' });
      } else {
        const { error: err } = await supabase.from('learning_tracks').insert({
          slug,
          name: form.name.trim(),
          icon: form.icon.trim() || '📚',
          theme_key: form.theme_key,
          order_index: form.order_index,
        });
        if (err) throw err;
        toast({ title: 'Success', description: 'Track created', variant: 'success' });
      }
      const { data } = await supabase.from('learning_tracks').select('*').order('order_index', { ascending: true });
      await refetch();
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Delete track "${slug}"? Modules using this track must be reassigned first.`)) return;
    setDeletingId(id);
    try {
      const { error: err } = await supabase.from('learning_tracks').delete().eq('id', id);
      if (err) throw err;
      toast({ title: 'Success', description: 'Track deleted', variant: 'success' });
      await refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot delete: may have modules using this track';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute requireRole="admin">
      <AdminNavBar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/admin/content')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Learning Tracks</h1>
            <button
              onClick={() => {
                setForm({
                  slug: '',
                  name: '',
                  icon: '📚',
                  theme_key: 'gray',
                  order_index: (tracks?.length ?? 0) + 1,
                });
                setEditingId(null);
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5" />
              Add Track
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit Track' : 'New Track'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="e.g. video"
                    disabled={!!editingId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                  {editingId && <p className="text-xs text-gray-500 mt-1">Slug cannot be changed when editing.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Video"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="🎬"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                  <select
                    value={form.theme_key}
                    onChange={(e) => setForm((f) => ({ ...f, theme_key: e.target.value as ThemeKey }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {THEME_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    min={1}
                    value={form.order_index}
                    onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-gray-500">Loading tracks...</div>
          ) : (
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theme</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(tracks ?? []).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{t.order_index}</td>
                      <td className="px-4 py-3 text-2xl">{t.icon}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{t.slug}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{t.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.theme_key}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-2 text-gray-500 hover:text-primary-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.slug)}
                          disabled={deletingId === t.id}
                          className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function AdminLearningTracksPage() {
  return <AdminLearningTracksContent />;
}
