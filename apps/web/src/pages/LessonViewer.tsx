import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { AchievementNotification } from '@/components/child/AchievementNotification';
import { supabase } from '@/lib/supabase';
import { useModule, Lesson } from '@/hooks/useModules';
import { Download, FileText, Presentation, ExternalLink, Sparkles } from 'lucide-react';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string | null;
  order_index: number;
}

export default function LessonViewerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    xpEarned: number;
    newAchievements: any[];
    leveledUp: boolean;
    newLevel?: number;
    type: 'lesson' | 'module';
  } | null>(null);

  useEffect(() => {
    // Clear any existing Supabase auth session to ensure we use anon role
    // This is important because child sessions use access codes, not Supabase Auth
    supabase.auth.signOut().catch(() => {
      // Ignore errors if already signed out
    });

    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      navigate('/child/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      setChildSession(session);
    } catch (err) {
      navigate('/child/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!lessonId) return;

    async function fetchLesson() {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (error) throw error;
        setLesson(data);

        // If it's a quiz lesson, fetch questions
        if (data.lesson_type === 'quiz') {
          const { data: questions, error: qError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('lesson_id', lessonId)
            .order('order_index', { ascending: true });

          if (qError) throw qError;
          setQuizQuestions(questions || []);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to fetch lesson:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  // Check if lesson is already completed
  useEffect(() => {
    if (!childSession || !lessonId) return;

    async function checkLessonProgress() {
      if (!childSession) return;
      
      try {
        const { data, error } = await supabase
          .from('child_lesson_progress')
          .select('is_completed')
          .eq('child_id', childSession.childId)
          .eq('lesson_id', lessonId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is fine
          console.error('Failed to check lesson progress:', error);
          return;
        }

        if (data) {
          setLessonCompleted(data.is_completed || false);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error checking lesson progress:', error);
      }
    }

    checkLessonProgress();
  }, [childSession, lessonId]);

  const { module } = useModule(lesson?.module_id || '');

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer_index;
    setQuizResults([...quizResults, isCorrect]);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      handleCompleteLesson();
    }
  };

  const handleCompleteLesson = async () => {
    if (!childSession || !lesson || lessonCompleted) return;

    setCompleting(true);
    try {
      const quizScore = lesson.lesson_type === 'quiz' && quizResults.length > 0
        ? Math.round((quizResults.filter(Boolean).length / quizResults.length) * 100)
        : null;

      // Mark lesson as completed
      const { error: progressError } = await supabase
        .from('child_lesson_progress')
        .upsert({
          child_id: childSession.childId,
          lesson_id: lesson.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
          quiz_score: quizScore,
        }, {
          onConflict: 'child_id,lesson_id',
        });

      if (progressError) throw progressError;

      // Mark lesson as completed in state
      setLessonCompleted(true);

      // Award achievements and XP first (before creating activity)
      let awardData = null;
      try {
        const { data, error: awardError } = await supabase
          .rpc('award_achievements_and_xp', {
            p_child_id: childSession.childId,
            p_activity_type: 'lesson_complete',
            p_module_id: lesson.module_id || null,
            p_quiz_score: quizScore || null,
          });

        if (awardError) {
          console.error('Failed to award achievements:', awardError);
          // Log error but continue - don't block lesson completion
        } else if (data && data.length > 0) {
          awardData = data[0];
          console.warn('Lesson award data:', awardData);
        } else {
          console.warn('No data returned from award_achievements_and_xp for lesson');
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error calling award_achievements_and_xp:', error);
        // Continue even if achievement awarding fails
      }

      // Create activity with XP earned
      await supabase.from('activities').insert({
        child_id: childSession.childId,
        activity_type: 'lesson_complete',
        module_id: lesson.module_id,
        lesson_id: lesson.id,
        quiz_score: quizScore,
        xp_earned: awardData?.xp_earned || 0,
      });

      // Update module progress BEFORE showing notification
      // This ensures progress is always updated when lessons are completed
      if (module) {
        // First, check current module progress to see if it was already completed
        const { data: currentModuleProgress } = await supabase
          .from('child_module_progress')
          .select('status, completed_at')
          .eq('child_id', childSession.childId)
          .eq('module_id', module.id)
          .single();

        const wasAlreadyCompleted = currentModuleProgress?.status === 'completed' && currentModuleProgress?.completed_at;

        const { data: moduleLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('module_id', module.id);

        const { data: completedLessons } = await supabase
          .from('child_lesson_progress')
          .select('lesson_id')
          .eq('child_id', childSession.childId)
          .eq('is_completed', true)
          .in('lesson_id', moduleLessons?.map((l) => l.id) || []);

        const progressPercentage = moduleLessons
          ? Math.round(((completedLessons?.length || 0) / moduleLessons.length) * 100)
          : 0;

        const isModuleComplete = progressPercentage === 100;

        await supabase
          .from('child_module_progress')
          .upsert({
            child_id: childSession.childId,
            module_id: module.id,
            status: isModuleComplete ? 'completed' : 'in_progress',
            progress_percentage: progressPercentage,
            completed_at: isModuleComplete ? new Date().toISOString() : currentModuleProgress?.completed_at || null,
          }, {
            onConflict: 'child_id,module_id',
          });

        // Show lesson completion notification if we have award data (after module progress is updated)
        if (awardData) {
          setNotification({
            isOpen: true,
            xpEarned: awardData.xp_earned || 0,
            newAchievements: Array.isArray(awardData.new_achievements) ? awardData.new_achievements : [],
            leveledUp: awardData.leveled_up || false,
            newLevel: awardData.new_level,
            type: 'lesson',
          });
          // Don't navigate yet - wait for user to close notification
          return;
        }

        // If module is complete AND wasn't already completed, create module completion activity and award achievements and XP
        if (isModuleComplete && !wasAlreadyCompleted) {
          // Get quiz score from the final quiz lesson in the module
          let finalQuizScore: number | null = null;
          try {
            // Find quiz lessons in the module, ordered by order_index (descending to get the last one)
            const { data: quizLessons } = await supabase
              .from('lessons')
              .select('id')
              .eq('module_id', module.id)
              .eq('lesson_type', 'quiz')
              .order('order_index', { ascending: false })
              .limit(1);

            if (quizLessons && quizLessons.length > 0) {
              // Get the quiz score from the most recent quiz lesson completion
              const { data: quizProgress } = await supabase
                .from('child_lesson_progress')
                .select('quiz_score')
                .eq('child_id', childSession.childId)
                .eq('lesson_id', quizLessons[0].id)
                .eq('is_completed', true)
                .single();

              if (quizProgress && quizProgress.quiz_score !== null) {
                finalQuizScore = quizProgress.quiz_score;
              }
            }
          } catch (err) {
            console.warn('Could not retrieve quiz score for module completion:', err);
            // Continue without quiz score
          }

          // Award module completion achievements and XP first
          let moduleAwardData = null;
          try {
            const { data, error: moduleAwardError } = await supabase
              .rpc('award_achievements_and_xp', {
                p_child_id: childSession.childId,
                p_activity_type: 'module_complete',
                p_module_id: module.id,
                p_quiz_score: finalQuizScore,
              });

            if (moduleAwardError) {
              console.error('Failed to award module achievements:', moduleAwardError);
              // Show error to user
              alert('Failed to award achievements and XP: ' + (moduleAwardError.message || 'Unknown error'));
            } else if (data && data.length > 0) {
              moduleAwardData = data[0];
              console.warn('Module award data:', moduleAwardData);
            } else {
              console.warn('No data returned from award_achievements_and_xp');
            }
          } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error('Error calling award_achievements_and_xp for module:', error);
            alert('Error awarding achievements and XP: ' + (error.message || 'Unknown error'));
          }

          // Create module completion activity with XP earned
          await supabase.from('activities').insert({
            child_id: childSession.childId,
            activity_type: 'module_complete',
            module_id: module.id,
            quiz_score: finalQuizScore,
            xp_earned: moduleAwardData?.xp_earned || 0,
          });

          // Show module completion notification
          if (moduleAwardData) {
            // Update module progress with XP earned
            await supabase
              .from('child_module_progress')
              .update({
                xp_earned: moduleAwardData.xp_earned || 0,
              })
              .eq('child_id', childSession.childId)
              .eq('module_id', module.id);
            
            setNotification({
              isOpen: true,
              xpEarned: moduleAwardData.xp_earned || 0,
              newAchievements: Array.isArray(moduleAwardData.new_achievements) ? moduleAwardData.new_achievements : [],
              leveledUp: moduleAwardData.leveled_up || false,
              newLevel: moduleAwardData.new_level,
              type: 'module',
            });
            // Don't navigate yet - wait for user to close notification
            return;
          }
        }

        // Navigate back to module (whether completed or not)
        if (module) {
          navigate(`/child/modules/${module.id}`);
        } else {
          navigate('/child/modules');
        }
      } else {
        // No module, but still show notification if we have award data
        if (awardData) {
          setNotification({
            isOpen: true,
            xpEarned: awardData.xp_earned || 0,
            newAchievements: Array.isArray(awardData.new_achievements) ? awardData.new_achievements : [],
            leveledUp: awardData.leveled_up || false,
            newLevel: awardData.new_level,
            type: 'lesson',
          });
          // Don't navigate yet - wait for user to close notification
          return;
        }
        // No notification, navigate back
        navigate('/child/modules');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert('Failed to complete lesson: ' + (error.message || 'Unknown error'));
    } finally {
      setCompleting(false);
    }
  };

  const handleNotificationClose = () => {
    setNotification(null);
    // Navigate after notification is closed
    if (module) {
      navigate(`/child/modules/${module.id}`);
    } else {
      navigate('/child/modules');
    }
  };

  if (loading) {
    return <LoadingAnimation message="Loading lesson..." variant="fullscreen" />;
  }

  if (!lesson || !childSession) {
    return null;
  }

  // Quiz lesson
  if (lesson.lesson_type === 'quiz' && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer !== null && selectedAnswer === currentQuestion.correct_answer_index;
    const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
          <ChildNavBar />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="card mb-6">
            <div className="mb-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{renderFormattedText(currentQuestion.question)}</h1>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  } ${
                    showExplanation && index === currentQuestion.correct_answer_index
                      ? 'border-green-500 bg-green-50'
                      : ''
                  } ${
                    showExplanation && selectedAnswer === index && !isCorrect
                      ? 'border-red-500 bg-red-50'
                      : ''
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}. </span>
                  {renderFormattedText(option)}
                </button>
              ))}
            </div>

            {showExplanation && currentQuestion.explanation && (
              <div className={`p-4 rounded-lg mb-4 ${
                isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                  {renderFormattedText(currentQuestion.explanation)}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {lessonCompleted ? (
                <div className="w-full bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">✓</span>
                    <h3 className="text-lg font-bold text-green-800">Quiz Completed!</h3>
                  </div>
                  <p className="text-green-700 text-sm">You've already completed this quiz.</p>
                </div>
              ) : !showExplanation ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={selectedAnswer === null}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={completing || lessonCompleted}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {isLastQuestion ? (completing ? 'Completing...' : 'Complete Quiz') : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        </div>
        {notification && (
          <AchievementNotification
            isOpen={notification.isOpen}
            onClose={handleNotificationClose}
            xpEarned={notification.xpEarned}
            newAchievements={notification.newAchievements}
            leveledUp={notification.leveledUp}
            newLevel={notification.newLevel}
            type={notification.type}
          />
        )}
      </div>
      </>
    );
  }

  const handleDownload = () => {
    if (!lesson.content_url) return;
    const link = document.createElement('a');
    link.href = lesson.content_url;
    link.download = `${lesson.title}.${lesson.lesson_type === 'pdf' ? 'pdf' : 'pptx'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to check if URL is YouTube
  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/;
    return youtubeRegex.test(url);
  };

  // Helper function to convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    // Format: https://youtu.be/VIDEO_ID
    else {
      const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
      if (shortMatch) {
        videoId = shortMatch[1];
      }
      // Format: https://www.youtube.com/embed/VIDEO_ID
      else {
        const embedMatch = url.match(/\/embed\/([^?&]+)/);
        if (embedMatch) {
          videoId = embedMatch[1];
        }
      }
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url; // Return original if we can't parse it
  };

  // Helper function to parse and render text with bold formatting
  const renderFormattedText = (text: string): React.ReactNode => {
    if (!text) return null;
    
    // Split by **text** pattern to support bold formatting
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(
            <span key={key++}>{beforeText}</span>
          );
        }
      }
      
      // Add bold text
      parts.push(
        <strong key={key++} className="font-bold">{match[1]}</strong>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text after last match
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(
          <span key={key++}>{remainingText}</span>
        );
      }
    }
    
    // If no matches found, return original text
    if (parts.length === 0) {
      return text;
    }
    
    return <>{parts}</>;
  };

  // Text or video lesson
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6 overflow-hidden">
          {/* Header with animated gradient */}
          <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <Sparkles className="absolute top-4 left-4 h-8 w-8 animate-pulse" />
              <Sparkles className="absolute top-8 right-8 h-6 w-6 animate-pulse delay-300" />
              <Sparkles className="absolute bottom-4 left-1/2 h-5 w-5 animate-pulse delay-700" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                {lesson.lesson_type === 'pdf' && (
                  <FileText className="h-8 w-8 text-white" />
                )}
                {lesson.lesson_type === 'presentation' && (
                  <Presentation className="h-8 w-8 text-white" />
                )}
                {lesson.lesson_type === 'video' && (
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg">▶</span>
                  </div>
                )}
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
              </div>
              {lesson.lesson_type === 'pdf' || lesson.lesson_type === 'presentation' ? (
                <p className="text-white/90 text-sm">
                  {lesson.lesson_type === 'pdf' ? 'PDF Document' : 'PowerPoint Presentation'}
                </p>
              ) : null}
            </div>
          </div>

          <div className="p-6">
            {lesson.lesson_type === 'video' && lesson.content_url && (
              <div className="mb-6">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-xl">
                  {isYouTubeUrl(lesson.content_url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(lesson.content_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={lesson.title}
                    />
                  ) : (
                    <video
                      src={lesson.content_url}
                      controls
                      className="w-full h-full"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            )}

            {lesson.lesson_type === 'pdf' && lesson.content_url && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">PDF Document</p>
                      <p className="text-sm text-gray-600">View and download the PDF below</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                </div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg" style={{ height: '600px' }}>
                  <iframe
                    src={`${lesson.content_url}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full"
                    title={lesson.title}
                  />
                </div>
              </div>
            )}

            {lesson.lesson_type === 'presentation' && lesson.content_url && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Presentation className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-900">PowerPoint Presentation</p>
                      <p className="text-sm text-gray-600">View in browser or download to open in PowerPoint</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.content_url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Online
                    </a>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg bg-gray-50" style={{ height: '600px' }}>
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.content_url)}`}
                    className="w-full h-full"
                    title={lesson.title}
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Tip:</strong> For the best experience, download the presentation and open it in Microsoft PowerPoint or Google Slides.
                  </p>
                </div>
              </div>
            )}

            {lesson.content && (
              <div className="prose max-w-none mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {renderFormattedText(lesson.content)}
                </div>
              </div>
            )}

            {!lesson.content && !lesson.content_url && (
              <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-lg">Lesson content coming soon!</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              {lessonCompleted ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">✓</span>
                    <h3 className="text-xl font-bold text-green-800">Lesson Completed!</h3>
                  </div>
                  <p className="text-green-700">You've already completed this lesson. Great job!</p>
                </div>
              ) : (
              <button
                onClick={handleCompleteLesson}
                disabled={completing}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {completing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Completing...
                  </span>
                ) : (
                  '✨ Mark as Complete'
                )}
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {notification && (
        <AchievementNotification
          isOpen={notification.isOpen}
          onClose={handleNotificationClose}
          xpEarned={notification.xpEarned}
          newAchievements={notification.newAchievements}
          leveledUp={notification.leveledUp}
          newLevel={notification.newLevel}
          type={notification.type}
        />
      )}
    </div>
  );
}

