import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/child';
import { ArrowLeft, Edit, Trophy, TrendingUp, BookOpen, Clock, Award, File, Download, FileText } from 'lucide-react';
import { EditChildModal } from '@/components/parent/EditChildModal';
import { ChildCodeDisplay } from '@/components/parent/ChildCodeDisplay';
import { formatCurrency } from '@/utils/currency';

interface ChildProgress {
  total_modules: number;
  completed_modules: number;
  total_lessons: number;
  completed_lessons: number;
  total_activities: number;
  recent_activities: any[];
}

interface ChildCompany {
  id: string;
  company_name: string;
  product_name: string | null;
  logo_url: string | null;
  initial_capital: number;
  current_balance: number;
  total_revenue: number;
  total_expenses: number;
}

interface ChildAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  achievement: {
    name: string;
    description: string;
    icon_url: string | null;
    rarity: string;
  };
}

interface TrackSubmission {
  id: string;
  module_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  notes: string | null;
  submitted_at: string;
  module: {
    title: string;
    track: string;
  };
}

function ChildDetailContent() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [company, setCompany] = useState<ChildCompany | null>(null);
  const [achievements, setAchievements] = useState<ChildAchievement[]>([]);
  const [submissions, setSubmissions] = useState<TrackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!childId) {
      navigate('/dashboard');
      return;
    }

    async function fetchChildDetails() {
      try {
        // Fetch child
        const { data: childData, error: childError } = await supabase
          .from('children')
          .select('*')
          .eq('id', childId)
          .is('deleted_at', null)
          .single();

        if (childError || !childData) {
          navigate('/dashboard');
          return;
        }

        setChild(childData as Child);

        // Fetch progress
        const [modulesProgress, lessonsProgress, activitiesData, companyData, achievementsData, submissionsData] = await Promise.all([
          // Module progress
          supabase
            .from('child_module_progress')
            .select('module_id, status')
            .eq('child_id', childId),
          // Lesson progress
          supabase
            .from('child_lesson_progress')
            .select('lesson_id, is_completed')
            .eq('child_id', childId),
          // Activities
          supabase
            .from('activities')
            .select('*')
            .eq('child_id', childId)
            .order('created_at', { ascending: false })
            .limit(10),
          // Company
          supabase
            .from('companies')
            .select('*')
            .eq('child_id', childId)
            .single(),
          // Achievements
          supabase
            .from('child_achievements')
            .select(`
              id,
              earned_at,
              achievements!inner (
                id,
                name,
                description,
                icon_url,
                rarity
              )
            `)
            .eq('child_id', childId)
            .order('earned_at', { ascending: false }),
          // Track Submissions
          supabase
            .from('track_submissions')
            .select(`
              id,
              module_id,
              file_url,
              file_name,
              file_size,
              mime_type,
              notes,
              submitted_at,
              modules!inner (
                title,
                track
              )
            `)
            .eq('child_id', childId)
            .order('submitted_at', { ascending: false }),
        ]);

        const totalModules = modulesProgress.data?.length || 0;
        const completedModules = modulesProgress.data?.filter((m) => m.status === 'completed').length || 0;
        const totalLessons = lessonsProgress.data?.length || 0;
        const completedLessons = lessonsProgress.data?.filter((l) => l.is_completed).length || 0;

        setProgress({
          total_modules: totalModules,
          completed_modules: completedModules,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          total_activities: activitiesData.data?.length || 0,
          recent_activities: activitiesData.data || [],
        });

        if (companyData.data) {
          setCompany(companyData.data as ChildCompany);
        }

        if (achievementsData.data) {
          setAchievements(
            achievementsData.data.map((a: any) => ({
              id: a.id,
              achievement_id: a.achievements.id,
              earned_at: a.earned_at,
              achievement: a.achievements,
            }))
          );
        }

        if (submissionsData.data) {
          setSubmissions(
            submissionsData.data.map((s: any) => ({
              id: s.id,
              module_id: s.module_id,
              file_url: s.file_url,
              file_name: s.file_name,
              file_size: s.file_size,
              mime_type: s.mime_type,
              notes: s.notes,
              submitted_at: s.submitted_at,
              module: s.modules,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching child details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChildDetails();
  }, [childId, navigate]);

  const handleEditSuccess = async () => {
    // Refetch child data
    if (!childId) return;
    const { data: childData } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();
    if (childData) {
      setChild(childData as Child);
    }
  };

  const handleDownloadReport = async () => {
    if (!child || submissions.length === 0) return;

    // Open window for report
    const loadingWindow = window.open('', '_blank');
    if (!loadingWindow) return;

    const isImageFile = (mimeType: string | null) => {
      return mimeType?.startsWith('image/') || false;
    };

    // Convert image to base64 for reliable PDF printing
    const convertImageToBase64 = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting image to base64:', error);
        return url; // Fallback to original URL
      }
    };

    // Generate signed URLs and convert images to base64 for PDF printing
    const submissionsWithUrls = await Promise.all(
      submissions.map(async (submission) => {
        let imageUrl = null;
        let fileUrl = null;
        
        // Generate signed URL for the file
        const { data, error } = await supabase.storage
          .from('track-submissions')
          .createSignedUrl(submission.file_url, 86400); // 24 hours expiry
        
        if (!error && data) {
          if (isImageFile(submission.mime_type)) {
            // Convert image to base64 for reliable PDF printing
            imageUrl = await convertImageToBase64(data.signedUrl);
          } else {
            fileUrl = data.signedUrl;
          }
        }
        
        return { ...submission, imageUrl, fileUrl };
      })
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Learning Track Submissions Report - ${child.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@300;400;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif; 
              padding: 0;
              color: #2c3e50;
              line-height: 1.7;
              background: #f5f7fa;
            }
            
            .container {
              max-width: 1100px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
            }
            
            .header {
              background: #1a2332;
              color: white;
              padding: 60px 50px 50px 50px;
              border-bottom: 5px solid #2c5aa0;
            }
            
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 25px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .header h1 {
              font-family: 'Playfair Display', serif;
              font-size: 36px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.5px;
            }
            
            .report-date {
              font-size: 13px;
              color: rgba(255, 255, 255, 0.8);
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 5px;
            }
            
            .header-subtitle {
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 300;
              letter-spacing: 0.5px;
            }
            
            .content {
              padding: 50px;
            }
            
            .executive-summary {
              background: #f8f9fa;
              border-left: 4px solid #2c5aa0;
              padding: 30px;
              margin-bottom: 50px;
            }
            
            .executive-summary h2 {
              font-family: 'Playfair Display', serif;
              font-size: 24px;
              color: #1a2332;
              margin-bottom: 20px;
              font-weight: 600;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 25px;
              margin-top: 25px;
            }
            
            .summary-item {
              padding: 20px;
              background: white;
              border: 1px solid #e1e8ed;
            }
            
            .summary-label {
              font-size: 11px;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .summary-value {
              font-size: 24px;
              font-weight: 700;
              color: #1a2332;
              font-family: 'Playfair Display', serif;
            }
            
            .section-title {
              font-family: 'Playfair Display', serif;
              font-size: 28px;
              font-weight: 600;
              color: #1a2332;
              margin: 50px 0 30px 0;
              padding-bottom: 15px;
              border-bottom: 2px solid #2c5aa0;
            }
            
            .submission-item {
              background: white;
              border: 1px solid #e1e8ed;
              margin-bottom: 35px;
              page-break-inside: avoid;
              transition: box-shadow 0.2s;
            }
            
            .submission-item:hover {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            
            .submission-header {
              background: #f8f9fa;
              padding: 25px 30px;
              border-bottom: 1px solid #e1e8ed;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
            }
            
            .module-title {
              font-size: 20px;
              font-weight: 600;
              color: #1a2332;
              font-family: 'Playfair Display', serif;
            }
            
            .submission-date {
              color: #6c757d;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
            }
            
            .submission-body {
              padding: 30px;
            }
            
            .file-info {
              margin-bottom: 20px;
            }
            
            .file-name {
              font-weight: 600;
              color: #2c5aa0;
              font-size: 15px;
              margin-bottom: 15px;
              display: block;
            }
            
            .track-label {
              display: inline-block;
              background: #e8f0f8;
              color: #2c5aa0;
              padding: 6px 14px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 10px;
            }
            
            .image-container {
              margin: 25px 0;
              text-align: center;
              background: #f8f9fa;
              padding: 25px;
              border: 1px solid #e1e8ed;
            }
            
            .submission-image {
              max-width: 100%;
              max-height: 600px;
              border: 1px solid #e1e8ed;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .file-link {
              display: inline-block;
              margin-top: 10px;
              padding: 10px 20px;
              background: #2c5aa0;
              color: white;
              text-decoration: none;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              transition: background 0.2s;
            }
            
            .file-link:hover {
              background: #1e3f73;
            }
            
            .notes {
              background: #fff9e6;
              padding: 20px;
              border-left: 4px solid #d4a017;
              margin-top: 20px;
            }
            
            .notes-label {
              font-size: 12px;
              color: #856404;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            
            .notes-content {
              color: #856404;
              font-size: 14px;
              line-height: 1.6;
            }
            
            .footer {
              margin-top: 60px;
              padding: 40px 50px;
              background: #1a2332;
              color: rgba(255, 255, 255, 0.7);
              text-align: center;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .divider {
              height: 1px;
              background: #e1e8ed;
              margin: 30px 0;
            }
            
            @media print {
              body {
                background: white;
              }
              .container {
                box-shadow: none;
              }
              .header {
                background:rgb(11, 11, 4) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .submission-item {
                page-break-inside: avoid;
                border: 1px solid #e1e8ed;
              }
              .submission-image {
                max-height: 500px;
              }
              .file-link {
                background: #2c5aa0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-top">
                <div>
                  <h1>${child.name}'s Business Proposal</h1>
                  <div class="header-subtitle">Comprehensive Project Portfolio Documentation</div>
                </div>
                <div class="report-date">
                  Generated: ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            
            <div class="content">
              <div class="executive-summary">
                <h2>Executive Summary</h2>
                <p style="color: #495057; margin-bottom: 20px; font-size: 15px;">
                  This report presents a comprehensive overview of all project submissions completed by the student, 
                  documenting their progress, achievements, and portfolio of work across various learning tracks.
                </p>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-label">Student Name</div>
                    <div class="summary-value">${child.name}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Age</div>
                    <div class="summary-value">${child.age}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Total Experience Points</div>
                    <div class="summary-value">${child.total_xp}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Current Level</div>
                    <div class="summary-value">${child.current_level}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Total Projects</div>
                    <div class="summary-value">${submissions.length}</div>
                  </div>
                </div>
              </div>

              <div class="section-title">Project Submissions</div>
              
              ${submissionsWithUrls.map((submission, index) => {
                const isImage = isImageFile(submission.mime_type);
                const imageDisplay = isImage && submission.imageUrl 
                  ? `<div class="image-container">
                       <img src="${submission.imageUrl}" class="submission-image" />
                     </div>`
                  : '';
                
                const fileLink = !isImage && submission.fileUrl
                  ? `<a href="${submission.fileUrl}" target="_blank" class="file-link">View File</a>`
                  : '';

                const trackName = submission.module.track.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                const formattedDate = new Date(submission.submitted_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return `
                  <div class="submission-item">
                    <div class="submission-header">
                      <div class="module-title">${submission.module.title}</div>
                      <div class="submission-date">Submitted: ${formattedDate}</div>
                    </div>
                    
                    <div class="submission-body">
                      <div class="file-info">
                        ${fileLink}
                        ${imageDisplay}
                        <div class="track-label">Learning Track: ${trackName}</div>
                      </div>
                      
                      ${submission.notes ? `
                        <div class="notes">
                          <div class="notes-label">Additional Notes</div>
                          <div class="notes-content">${submission.notes}</div>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  ${index < submissionsWithUrls.length - 1 ? '<div class="divider"></div>' : ''}
                `;
              }).join('')}

              <div class="footer">
                <p>MyCEO Learning Platform - Confidential Project Submissions Report</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    loadingWindow.document.write(htmlContent);
    loadingWindow.document.close();
    
    // Wait for all images to load before printing (base64 images load instantly, but we still wait for rendering)
    const images = loadingWindow.document.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      return new Promise<boolean>((resolve) => {
        if (img.complete) {
          resolve(true);
        } else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          // Timeout after 5 seconds per image
          setTimeout(() => resolve(false), 5000);
        }
      });
    });

    // Wait for all images to load, then print
    await Promise.all(imagePromises);
    
    // Additional small delay to ensure everything is rendered
    setTimeout(() => {
      loadingWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ParentNavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <p className="text-gray-600">Child not found</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ParentNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {child.profile_picture_url ? (
                <img
                  src={child.profile_picture_url}
                  alt={child.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-3xl">{child.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{child.name}</h1>
                <p className="text-gray-600">
                  Level {child.current_level} • {child.total_xp} XP • {child.current_streak} day streak
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCode(!showCode)} className="btn btn-secondary">
                {showCode ? 'Hide' : 'Show'} Access Code
              </button>
              {submissions.length > 0 && (
                <button onClick={handleDownloadReport} className="btn btn-secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Complete Report
                </button>
              )}
              <button onClick={() => setIsEditModalOpen(true)} className="btn btn-primary">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Access Code Display */}
        {showCode && (
          <div className="mb-6">
            <ChildCodeDisplay code={child.access_code} childName={child.name} />
          </div>
        )}

        {/* Progress Overview */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-600">Modules</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progress.completed_modules} / {progress.total_modules}
              </p>
              {progress.total_modules > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(progress.completed_modules / progress.total_modules) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="text-sm font-medium text-gray-600">Lessons</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progress.completed_lessons} / {progress.total_lessons}
              </p>
              {progress.total_lessons > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(progress.completed_lessons / progress.total_lessons) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <h3 className="text-sm font-medium text-gray-600">Activities</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{progress.total_activities}</p>
              <p className="text-xs text-gray-500 mt-1">Total completed</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <h3 className="text-sm font-medium text-gray-600">Achievements</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
              <p className="text-xs text-gray-500 mt-1">Earned badges</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Company Info */}
          {company && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Company
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="text-lg font-semibold">{company.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(company.current_balance)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(company.total_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(company.total_expenses)}
                    </p>
                  </div>
                </div>
                {company.product_name && (
                  <p className="text-sm text-gray-500 mt-2">
                    Product: {company.product_name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Achievements */}
          {achievements.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Recent Achievements
              </h2>
              <div className="space-y-3">
                {achievements.slice(0, 5).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {achievement.achievement.icon_url ? (
                      <img
                        src={achievement.achievement.icon_url}
                        alt={achievement.achievement.name}
                        className="w-10 h-10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{achievement.achievement.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Track Submissions */}
        {submissions.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Project Submissions
            </h2>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{submission.module.title}</h3>
                      <p className="text-sm text-gray-600">
                        Track: {submission.module.track.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 mb-2">
                    <File className="h-5 w-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{submission.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {submission.file_size ? `${(submission.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        {submission.mime_type && ` • ${submission.mime_type}`}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        // Generate signed URL for private bucket
                        const { data, error } = await supabase.storage
                          .from('track-submissions')
                          .createSignedUrl(submission.file_url, 3600); // 1 hour expiry
                        
                        if (error || !data) {
                          alert('Failed to generate file link. Please try again.');
                          return;
                        }
                        
                        window.open(data.signedUrl, '_blank');
                      }}
                      className="btn btn-sm btn-secondary"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                  
                  {submission.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700 italic">
                      "{submission.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {progress && progress.recent_activities.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {progress.recent_activities.map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium">
                      {activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) =>
                        l.toUpperCase()
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  {activity.xp_earned > 0 && (
                    <div className="ml-auto text-sm font-semibold text-primary-600">
                      +{activity.xp_earned} XP
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <EditChildModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          child={child}
        />
      </div>
    </div>
  );
}

export default function ChildDetailPage() {
  return (
    <ProtectedRoute>
      <ChildDetailContent />
    </ProtectedRoute>
  );
}

