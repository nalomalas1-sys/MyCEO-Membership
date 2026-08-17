import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { AchievementNotification } from '@/components/child/AchievementNotification';
import { supabase } from '@/lib/supabase';

// -style theme: option colors (red, blue, yellow, green)
const OPTION_COLORS = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-600', text: 'text-white' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-600', text: 'text-white' },
  { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500', border: 'border-yellow-600', text: 'text-gray-900' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', border: 'border-green-600', text: 'text-white' },
] as const;

// ─── Simple sound effects via Web Audio API (no asset files)
function playSound(type: 'correct' | 'wrong' | 'tick' | 'start') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 0.25;

    if (type === 'correct') {
      const play = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + duration);
      };
      play(523.25, 0, 0.12);
      play(659.25, 0.14, 0.2);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 120;
      osc.connect(gain);
      osc.start(0);
      osc.stop(0.25);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 400;
      osc.connect(gain);
      gain.gain.value = 0.12;
      osc.start(0);
      osc.stop(0.05);
    } else if (type === 'start') {
      const play = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + duration);
      };
      play(440, 0, 0.08);
      play(554.37, 0.1, 0.08);
      play(659.25, 0.2, 0.2);
    }
  } catch {
    // ignore if AudioContext not supported or autoplay blocked
  }
}

const FEEDBACK_DURATION_MS = 2000;

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
}

type Phase = 'idle' | 'countdown' | 'running' | 'finished';

interface ChallengeRunResult {
  xp_earned?: number;
  base_xp?: number;
  bonus_xp?: number;
  leveled_up?: boolean;
  current_level?: number;
  new_level?: number;
}

export default function ChallengeModePage() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const childSessionRef = useRef<ChildSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numCorrect, setNumCorrect] = useState(0);
  const [numAnswered, setNumAnswered] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const timerRef = useRef<number | null>(null);

  const numCorrectRef = useRef(0);
  const numAnsweredRef = useRef(0);
  const bestStreakRef = useRef(0);
  const hasFinishedRef = useRef(false);

  const [summary, setSummary] = useState<{
    xp_earned: number;
    base_xp: number;
    bonus_xp: number;
    leveled_up?: boolean;
    new_level?: number;
  } | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{ selectedIndex: number; isCorrect: boolean } | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const goTimeoutRef = useRef<number | null>(null);


  // 1) Load child_session
  useEffect(() => {
    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      navigate('/child/login');
      return;
    }
    try {
      const parsed = JSON.parse(sessionStr);
      setChildSession(parsed);
      childSessionRef.current = parsed;
    } catch {
      localStorage.removeItem('child_session');
      navigate('/child/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // 2) Load random quiz questions for the challenge (fetch then shuffle; Supabase doesn't support order('random()'))
  const loadQuestions = async () => {
    if (!childSession) return;

    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, question, options, correct_answer_index')
      .limit(50);

    if (error) {
      console.error('Failed to load challenge questions:', error);
      return;
    }

    const list = (data || []) as QuizQuestion[];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setQuestions(list.slice(0, 20));
    setCurrentIndex(0);

    setNumCorrect(0);
    setNumAnswered(0);
    setCurrentStreak(0);
    setBestStreak(0);

    numCorrectRef.current = 0;
    numAnsweredRef.current = 0;
    bestStreakRef.current = 0;
    hasFinishedRef.current = false;
  };

  // 3) Start challenge (with game-start sound)
  // 3) Start challenge: countdown 3-2-1-Go with sound, then run game (short "Go!" screen)
  const startChallenge = async () => {
    if (!childSession) return;
    setAnswerFeedback(null);
    await loadQuestions();
    setPhase('countdown');
    setCountdownNumber(3);
    playSound('tick');

    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          // Show "Go!" for 500ms, then start the game
          if (goTimeoutRef.current) window.clearTimeout(goTimeoutRef.current);
          goTimeoutRef.current = window.setTimeout(() => {
            goTimeoutRef.current = null;
            setPhase('running');
            setSecondsLeft(60);
            playSound('start');
            if (timerRef.current) window.clearInterval(timerRef.current);
            timerRef.current = window.setInterval(() => {
              setSecondsLeft((s) => {
                if (s <= 5 && s >= 1) playSound('tick');
                if (s <= 1) {
                  if (timerRef.current) window.clearInterval(timerRef.current);
                  return 0;
                }
                return s - 1;
              });
            }, 1000);
          }, 500);
          return 0; // show "Go!" for 500ms
        }
        playSound('tick');
        return prev - 1;
      });
    }, 1000);
  };

  // 4) Handle answer: show correct/wrong feedback, then auto-advance after FEEDBACK_DURATION_MS
  const handleAnswer = (optionIndex: number) => {
    if (phase !== 'running' || !questions[currentIndex] || answerFeedback !== null) return;
    const q = questions[currentIndex];
    const isCorrect = optionIndex === q.correct_answer_index;
    playSound(isCorrect ? 'correct' : 'wrong');

    setNumAnswered((n) => {
      const v = n + 1;
      numAnsweredRef.current = v;
      return v;
    });

    if (isCorrect) {
      setNumCorrect((c) => {
        const v = c + 1;
        numCorrectRef.current = v;
        return v;
      });

      setCurrentStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => {
          const v = Math.max(b, next);
          bestStreakRef.current = v;
          return v;
        });
        return next;
      });
    } else {
      setCurrentStreak(0);
    }

    setAnswerFeedback({ selectedIndex: optionIndex, isCorrect });

    // keep the rest of handleAnswer the same (feedbackTimeout, next question)

    if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      feedbackTimeoutRef.current = null;
      setAnswerFeedback(null);
      setCurrentIndex((idx) => {
        const nextIndex = idx + 1;
        if (nextIndex >= questions.length) return 0;
        return nextIndex;
      });
    }, FEEDBACK_DURATION_MS);
  };

  // 5) Finish challenge: call RPC to finalize & award XP
  const finishChallenge = async () => {
    const session = childSessionRef.current;
    if (!session || hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setPhase('finished');

    const answered = numAnsweredRef.current;
    const correct = numCorrectRef.current;
    const best = bestStreakRef.current;

    if (!answered) {
      setSummary({
        xp_earned: 0,
        base_xp: 0,
        bonus_xp: 0,
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('finish_challenge_run', {
        p_child_id: session.childId,
        p_num_questions: answered,
        p_num_correct: correct,
        p_best_streak: best,
      });

      if (error) {
        console.error('finish_challenge_run error:', error);
        return;
      }

      const result = data as ChallengeRunResult;
      setSummary({
        xp_earned: result.xp_earned ?? 0,
        base_xp: result.base_xp ?? 0,
        bonus_xp: result.bonus_xp ?? 0,
        leveled_up: result.leveled_up ?? false,
        new_level: result.current_level ?? result.new_level,
      });

      if (result.leveled_up) {
        setShowLevelModal(true);
      }
    } catch (err) {
      console.error('Failed to finish challenge:', err);
    }
  };

  useEffect(() => {
    if (secondsLeft === 0 && phase === 'running') {
      finishChallenge();
    }
  }, [secondsLeft, phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
      if (goTimeoutRef.current) window.clearTimeout(goTimeoutRef.current);
    };
  }, []);

  if (loading || !childSession) {
    return <LoadingAnimation message="Loading challenge..." variant="fullscreen" />;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#46178f]">
      <ChildNavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Kahoot-style header: white bar */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-lg">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-black text-[#46178f]">
              Challenge
            </h1>
            <span className="hidden sm:inline text-sm text-gray-500">|</span>
            <p className="text-sm text-gray-600">
              60 seconds · Streaks = bonus XP
            </p>
          </div>
          <button
            onClick={() => navigate('/child/dashboard')}
            className="text-sm font-semibold text-[#46178f] hover:text-[#6d28d9] underline"
          >
            ← Back
          </button>
        </div>

              {/* Timer + stats: white card (hidden during countdown) */}
        {phase !== 'countdown' && (
        <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-lg mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#46178f] flex items-center justify-center text-3xl font-black text-white shadow-lg">
              {secondsLeft}
            </div>
            <div className="flex gap-6 text-sm">
              <span><strong className="text-gray-900">{numAnswered}</strong> <span className="text-gray-500">answered</span></span>
              <span><strong className="text-green-600">{numCorrect}</strong> <span className="text-gray-500">correct</span></span>
              <span><strong className="text-orange-500">{currentStreak}</strong> <span className="text-gray-500">streak</span></span>
                          <span className="text-gray-400">Best: <strong className="text-orange-600">{bestStreak}</strong></span>
            </div>
          </div>
        </div>
        )}

        {/* Content */}
        {phase === 'countdown' && (
          <div className="rounded-2xl bg-white shadow-xl p-12 sm:p-16 text-center">
            <p className="text-7xl sm:text-9xl font-black text-[#46178f] animate-pulse">
              {countdownNumber === 0 || countdownNumber === null ? 'Go!' : countdownNumber}
            </p>
            <p className="text-gray-500 mt-6 text-lg">Get ready...</p>
          </div>
        )}

        {phase === 'idle' && (
          <div className="rounded-2xl bg-white shadow-xl p-8 text-center">
            <p className="text-gray-700 mb-6 text-base max-w-lg mx-auto">
              Press start and answer as many questions as you can in 60 seconds. Each correct answer gives XP — build a streak for bonus XP!
            </p>
            <button
              onClick={startChallenge}
              className="px-12 py-4 rounded-2xl bg-[#46178f] hover:bg-[#6d28d9] text-white text-xl font-black shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
            >
              Start game
            </button>
          </div>
        )}

        {phase === 'running' && currentQuestion && (
          <div className="rounded-2xl bg-white shadow-xl p-6 sm:p-8">
                      {answerFeedback !== null && (
              <div
                className={`mb-6 rounded-xl px-6 py-4 text-center font-black text-xl border-4 ${
                  answerFeedback.isCorrect
                    ? 'bg-green-600 text-white border-green-800 shadow-lg'
                    : 'bg-red-600 text-white border-red-800 shadow-lg'
                }`}
              >

                {answerFeedback.isCorrect ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-3xl" aria-hidden>✓</span>
                    <span>CORRECT!</span>
                  </span>
                ) : (
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-3xl" aria-hidden>✗</span>
                      <span>WRONG</span>
                    </span>
                    <span className="text-base font-bold opacity-90">
                      Correct answer was: {String.fromCharCode(65 + currentQuestion.correct_answer_index)}
                    </span>
                  </span>
                )}
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
              {currentQuestion.question}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((opt, idx) => {
                const style = OPTION_COLORS[idx % OPTION_COLORS.length];
                const isCorrectOption = idx === currentQuestion.correct_answer_index;
                const isSelectedWrong = answerFeedback !== null && answerFeedback.selectedIndex === idx && !answerFeedback.isCorrect;
                const showAsCorrect = answerFeedback !== null && isCorrectOption;
                const showAsWrong = answerFeedback !== null && isSelectedWrong;

                              let btnClass = `w-full px-6 py-5 rounded-2xl border-4 text-left font-bold text-base sm:text-lg transition-all duration-200 `;
                if (answerFeedback !== null) {
                  if (showAsCorrect) {
                    btnClass += 'bg-green-600 border-green-800 text-white shadow-xl ring-4 ring-green-400 cursor-default';
                  } else if (showAsWrong) {
                    btnClass += 'bg-red-600 border-red-800 text-white shadow-xl ring-4 ring-red-400 cursor-default';
                  } else {
                    btnClass += `opacity-40 ${style.bg} ${style.border} ${style.text} cursor-default`;
                  }
                } else {
                  btnClass += `${style.bg} ${style.hover} active:scale-95 ${style.border} shadow-lg hover:shadow-xl ${style.text}`;
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answerFeedback !== null}
                    className={btnClass}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-block w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center text-sm font-black">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {showAsCorrect && (
                        <span className="bg-white/30 px-3 py-1 rounded-lg text-sm font-black uppercase">
                          ✓ CORRECT
                        </span>
                      )}
                      {showAsWrong && (
                        <span className="bg-white/30 px-3 py-1 rounded-lg text-sm font-black uppercase">
                          ✗ WRONG
                        </span>
                      )}
                    </div>
                  </button>
                );
                
              })}
            </div>
            {answerFeedback !== null && (
              <p className="mt-4 text-center text-sm text-gray-500">
                Next question in {FEEDBACK_DURATION_MS / 1000}s...
              </p>
            )}
          </div>
        )}

        {phase === 'running' && questions.length === 0 && (
          <div className="rounded-2xl bg-white shadow-xl p-8 text-center border-2 border-amber-200">
            <p className="text-gray-700 mb-2 font-medium">No questions available right now.</p>
            <p className="text-sm text-gray-500">Add quiz questions to a lesson in Admin and publish the module.</p>
          </div>
        )}

        {phase === 'finished' && summary && (
          <div className="rounded-2xl bg-white shadow-xl p-8 border-4 border-green-300">
            <h2 className="text-2xl font-black text-gray-900 mb-4 text-center">
              Round complete! 🎉
            </h2>
            <div className="space-y-2 text-center mb-6">
              <p className="text-gray-700">
                <strong>{numCorrect}</strong> / <strong>{numAnswered}</strong> correct
              </p>
              <p className="text-gray-600">Best streak: <strong className="text-orange-600">{bestStreak}</strong></p>
              <p className="text-lg font-bold text-green-700">
                +{summary.xp_earned} XP
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={startChallenge}
                className="flex-1 py-4 rounded-2xl bg-[#46178f] hover:bg-[#6d28d9] text-white font-black text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
              >
                Play again
              </button>
              <button
                onClick={() => navigate('/child/dashboard')}
                className="flex-1 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-all"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {showLevelModal && summary && (
        <AchievementNotification
          isOpen={showLevelModal}
          onClose={() => setShowLevelModal(false)}
          xpEarned={summary.xp_earned}
          newAchievements={[]}
          leveledUp={summary.leveled_up}
          newLevel={summary.new_level}
          type="lesson"
        />
      )}
    </div>
  );
}