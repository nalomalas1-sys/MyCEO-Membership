import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  order_index: number;
}

interface QuizBuilderProps {
  lessonId: string | null;
  onQuestionsChange?: (questions: QuizQuestion[]) => void;
}

export function QuizBuilder({ lessonId, onQuestionsChange }: QuizBuilderProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (lessonId) {
      fetchQuestions();
    }
  }, [lessonId]);

  useEffect(() => {
    if (onQuestionsChange) {
      onQuestionsChange(questions);
    }
  }, [questions, onQuestionsChange]);

  async function fetchQuestions() {
    if (!lessonId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (error) {
        // Check if it's an auth error
        if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('Permission denied - you may not have admin access:', error);
          alert('Permission denied. Please ensure you are logged in as an admin.');
          return;
        }
        throw error;
      }
      setQuestions(data || []);
    } catch (err: any) {
      console.error('Failed to fetch questions:', err);
      alert('Failed to load questions: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function saveQuestion(question: QuizQuestion) {
    if (!lessonId) return;

    try {
      setSaving(true);
      const questionData = {
        lesson_id: lessonId,
        question: question.question,
        options: question.options,
        correct_answer_index: question.correct_answer_index,
        explanation: question.explanation || null,
        order_index: question.order_index,
      };

      if (question.id) {
        // Update existing
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', question.id);
        if (error) {
          // Check if it's an auth/permission error
          if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('policy')) {
            alert('Permission denied. Please ensure you are logged in as an admin and try refreshing the page.');
            return;
          }
          throw error;
        }
      } else {
        // Create new
        const { error } = await supabase.from('quiz_questions').insert(questionData);
        if (error) {
          // Check if it's an auth/permission error
          if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('policy')) {
            alert('Permission denied. Please ensure you are logged in as an admin and try refreshing the page.');
            return;
          }
          throw error;
        }
      }

      await fetchQuestions();
      setShowQuestionForm(false);
      setEditingQuestion(null);
    } catch (err: any) {
      console.error('Failed to save question:', err);
      alert('Failed to save question: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
      if (error) throw error;
      await fetchQuestions();
    } catch (err: any) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question');
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newQuestions = arrayMove(questions, oldIndex, newIndex);
    const updatedQuestions = newQuestions.map((q, index) => ({
      ...q,
      order_index: index + 1,
    }));

    setQuestions(updatedQuestions);

    // Update order in database
    try {
      const updates = updatedQuestions.map((q) =>
        supabase
          .from('quiz_questions')
          .update({ order_index: q.order_index })
          .eq('id', q.id!)
      );

      await Promise.all(updates);
    } catch (err: any) {
      console.error('Failed to reorder questions:', err);
      fetchQuestions(); // Revert
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      question: '',
      options: ['', ''],
      correct_answer_index: 0,
      explanation: '',
      order_index: questions.length + 1,
    });
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Flow Indicator */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border-2 border-primary-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Quiz Creation Flow</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>{questions.length} Question{questions.length !== 1 ? 's' : ''} Added</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-2 rounded-full ${questions.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`} />
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex-1 h-2 rounded-full ${questions.length >= 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex-1 h-2 rounded-full ${questions.length >= 5 ? 'bg-green-500' : 'bg-gray-200'}`} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Add Questions</span>
          <span>3+ Questions</span>
          <span>5+ Questions (Recommended)</span>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 border-2 border-dashed border-gray-300 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Questions Yet</h3>
          <p className="text-gray-500 mb-6">Start building your quiz by adding your first question</p>
          <button
            onClick={handleAddQuestion}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Questions ({questions.length})
            </h3>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id || '')}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <SortableQuestionCard
                    key={question.id || index}
                    question={question}
                    index={index}
                    onEdit={() => handleEditQuestion(question)}
                    onDelete={() => question.id && deleteQuestion(question.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && editingQuestion && (
        <QuestionFormModal
          question={editingQuestion}
          onSave={saveQuestion}
          onCancel={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

interface SortableQuestionCardProps {
  question: QuizQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableQuestionCard({ question, index, onEdit, onDelete }: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id || index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-primary-300 transition-all ${
        isDragging ? 'shadow-xl' : 'shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing rounded-lg hover:bg-gray-100"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <h4 className="text-base font-semibold text-gray-900 line-clamp-2">
                {question.question || 'Untitled Question'}
              </h4>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit question"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 ml-11">
            {question.options.map((option, optIndex) => (
              <div
                key={optIndex}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  optIndex === question.correct_answer_index
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    optIndex === question.correct_answer_index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300'
                  }`}
                >
                  {optIndex === question.correct_answer_index && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    optIndex === question.correct_answer_index
                      ? 'text-green-800 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {option || 'Empty option'}
                </span>
              </div>
            ))}
            {question.explanation && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 mb-1">Explanation:</p>
                <p className="text-sm text-blue-700">{question.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuestionFormModalProps {
  question: QuizQuestion;
  onSave: (question: QuizQuestion) => void;
  onCancel: () => void;
  saving: boolean;
}

function QuestionFormModal({ question, onSave, onCancel, saving }: QuestionFormModalProps) {
  const [formData, setFormData] = useState<QuizQuestion>(question);

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }

    const newOptions = formData.options.filter((_, i) => i !== index);
    let newCorrectIndex = formData.correct_answer_index;

    if (index < formData.correct_answer_index) {
      newCorrectIndex = formData.correct_answer_index - 1;
    } else if (index === formData.correct_answer_index) {
      newCorrectIndex = 0; // Reset to first option
    }

    setFormData({
      ...formData,
      options: newOptions,
      correct_answer_index: newCorrectIndex,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!formData.question.trim()) {
      alert('Please enter a question');
      return;
    }

    if (formData.options.some((opt) => !opt.trim())) {
      alert('Please fill in all options');
      return;
    }

    if (formData.options.length < 2) {
      alert('A question must have at least 2 options');
      return;
    }

    onSave(formData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {question.id ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6" onKeyDown={handleKeyDown}>
          {/* Question Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your question here..."
              required
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Answer Options *
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            </div>

            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.correct_answer_index === index
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correct_answer_index: index })}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        formData.correct_answer_index === index
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 hover:border-green-400'
                      }`}
                      title="Mark as correct answer"
                    >
                      {formData.correct_answer_index === index && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove option"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {formData.correct_answer_index === index && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Correct Answer</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Click the circle next to an option to mark it as the correct answer
            </p>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Explain why this is the correct answer..."
            />
            <p className="mt-1 text-xs text-gray-500">
              This explanation will be shown to students after they answer
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {question.id ? 'Update Question' : 'Add Question'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

