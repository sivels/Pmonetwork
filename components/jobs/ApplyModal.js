import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Upload, FileText, Sparkles, 
  User, MapPin, Briefcase, Award, Clock, 
  ArrowRight, ArrowLeft, Eye, Send, MessageSquare,
  Zap, Star, TrendingUp, ChevronRight, Home
} from 'lucide-react';

export default function ApplyModal({ 
  isOpen, 
  onClose, 
  job, 
  candidateProfile,
  onSubmit 
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cvFile: null,
    cvUrl: candidateProfile?.cvUrl || '',
    noteToEmployer: '',
    includeCoverLetter: false,
    coverLetter: '',
    useAiAssist: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowSuccess(false);
      setError(null);
      setFormData({
        cvFile: null,
        cvUrl: candidateProfile?.cvUrl || '',
        noteToEmployer: '',
        includeCoverLetter: false,
        coverLetter: '',
        useAiAssist: false
      });
    }
  }, [isOpen, candidateProfile]);

  const handleCvUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFormData({ ...formData, cvFile: file });
    } else {
      setError('Please upload a PDF or DOCX file');
    }
  };

  const generateCoverLetter = async () => {
    setIsGenerating(true);
    setError(null);
    
    // Simulate AI generation
    setTimeout(() => {
      const template = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.employer?.companyName}. With ${candidateProfile?.yearsExperience || 'several'} years of experience in ${candidateProfile?.sector || 'the industry'}, I believe I would be an excellent fit for this role.

${candidateProfile?.summary || 'My professional background has equipped me with the skills and expertise necessary to excel in this position.'}

Key highlights of my qualifications include:
• Proven expertise in ${candidateProfile?.skills?.slice(0, 3).map(s => s.name).join(', ') || 'relevant skills'}
• Strong track record of delivering results in ${job.specialism || 'project management'}
• ${job.isRemote ? 'Experienced in remote work environments' : 'Comfortable with on-site collaboration'}

I am particularly drawn to this opportunity because of ${job.employer?.companyName}'s reputation in the industry. I am confident that my skills and experience align well with your requirements, and I am excited about the possibility of contributing to your team.

I am available ${candidateProfile?.availability || 'to start immediately'} and would welcome the opportunity to discuss how my background and skills would benefit your organization.

Thank you for considering my application. I look forward to the possibility of speaking with you soon.

Best regards,
${candidateProfile?.fullName || 'Candidate'}`;

      setFormData({ ...formData, coverLetter: template });
      setIsGenerating(false);
    }, 1500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        jobId: job.id,
        coverLetter: formData.includeCoverLetter ? formData.coverLetter : null,
        availability: candidateProfile?.availability || '',
        cvUrl: formData.cvUrl,
        noteToEmployer: formData.noteToEmployer
      };

      await onSubmit(submitData);
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit application');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Success Screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
          {/* Confetti Effect */}
          <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIi8+PC9zdmc+')] opacity-30"></div>
            
            <div className="relative">
              <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                <CheckCircle2 className="h-12 w-12 text-green-600 animate-bounce-once" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Application Sent!</h2>
              <p className="text-green-50 text-lg">
                Your application for {job.title} has been successfully submitted
              </p>
            </div>
          </div>

          <div className="p-8 space-y-4">
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>The employer has been notified of your application</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You can track your application status in your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You'll receive email updates on your application progress</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.href = '/dashboard/candidate'}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                View Application
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/messages'}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Message Employer
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Continue Browsing Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 sm:px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <Building2 className="h-4 w-4" />
                  {job.employer?.companyName}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  Apply for {job.title}
                </h2>
                <p className="text-blue-100 text-sm">
                  {job.location} • {job.employmentType}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="mt-6 flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      step >= s 
                        ? 'bg-white text-blue-600' 
                        : 'bg-white/20 text-white/60'
                    }`}>
                      {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                    </div>
                    <span className={`hidden sm:inline text-sm font-medium ${
                      step >= s ? 'text-white' : 'text-white/60'
                    }`}>
                      {s === 1 && 'Profile'}
                      {s === 2 && 'Cover Letter'}
                      {s === 3 && 'Review'}
                    </span>
                  </div>
                  {s < 3 && (
                    <div className={`flex-1 h-1 rounded-full transition-all ${
                      step > s ? 'bg-white' : 'bg-white/20'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Profile Summary */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Review Your Profile</h3>
                  <p className="text-gray-600">Your application will include the following information</p>
                </div>

                {/* Profile Card */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-start gap-4 mb-6">
                    {candidateProfile?.profilePhotoUrl ? (
                      <img 
                        src={candidateProfile.profilePhotoUrl} 
                        alt={candidateProfile.fullName}
                        className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-white shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">{candidateProfile?.fullName}</h4>
                      <p className="text-gray-600">{candidateProfile?.jobTitle}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                        {candidateProfile?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {candidateProfile.location}
                          </span>
                        )}
                        {candidateProfile?.yearsExperience && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {candidateProfile.yearsExperience} years
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {candidateProfile?.skills && candidateProfile.skills.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {candidateProfile.skills.slice(0, 6).map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-sm font-medium rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {candidateProfile.skills.length > 6 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                            +{candidateProfile.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Work Preferences */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {candidateProfile?.remotePreference && (
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700 capitalize">{candidateProfile.remotePreference}</span>
                      </div>
                    )}
                    {candidateProfile?.employmentType && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{candidateProfile.employmentType}</span>
                      </div>
                    )}
                    {candidateProfile?.availability && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{candidateProfile.availability}</span>
                      </div>
                    )}
                  </div>

                  <a 
                    href="/dashboard/profile" 
                    target="_blank"
                    className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Profile
                  </a>
                </div>

                {/* CV Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Your CV <span className="text-red-500">*</span>
                  </label>
                  
                  {formData.cvUrl || formData.cvFile ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formData.cvFile ? formData.cvFile.name : 'Current CV'}
                          </p>
                          <p className="text-sm text-gray-600">Ready to submit</p>
                        </div>
                      </div>
                      <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          onChange={handleCvUpload}
                          className="hidden"
                        />
                        Replace
                      </label>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleCvUpload}
                        className="hidden"
                      />
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="font-medium text-gray-900 mb-1">Upload your CV</p>
                      <p className="text-sm text-gray-500">PDF or DOCX (max 5MB)</p>
                    </label>
                  )}
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Note to Employer <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.noteToEmployer}
                    onChange={(e) => setFormData({ ...formData, noteToEmployer: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Add any additional information you'd like the employer to know..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Cover Letter */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cover Letter</h3>
                  <p className="text-gray-600">Add a cover letter to strengthen your application</p>
                </div>

                {/* Toggle */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeCoverLetter}
                      onChange={(e) => setFormData({ ...formData, includeCoverLetter: e.target.checked })}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Include a cover letter</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Recommended: Applications with cover letters are 40% more likely to get a response
                      </p>
                    </div>
                  </label>
                </div>

                {formData.includeCoverLetter && (
                  <div className="space-y-4">
                    {/* AI Assist Button */}
                    {!formData.coverLetter && (
                      <button
                        onClick={generateCoverLetter}
                        disabled={isGenerating}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Generating your cover letter...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            Generate AI Cover Letter
                          </>
                        )}
                      </button>
                    )}

                    {/* Editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Your Cover Letter
                        </label>
                        <span className="text-xs text-gray-500">
                          {formData.coverLetter.length} characters
                        </span>
                      </div>
                      <textarea
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                        rows={12}
                        className="w-full rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm font-mono text-sm"
                        placeholder="Write your cover letter here..."
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        💡 Tip: Mention specific skills from the job description and explain how your experience matches their needs
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Review Your Application</h3>
                  <p className="text-gray-600">This is what the employer will see</p>
                </div>

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border-2 border-gray-200 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        Application for {job.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Submitted to {job.employer?.companyName}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                      New
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="flex items-start gap-4">
                    {candidateProfile?.profilePhotoUrl ? (
                      <img 
                        src={candidateProfile.profilePhotoUrl} 
                        alt={candidateProfile.fullName}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white shadow">
                        <User className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900">{candidateProfile?.fullName}</h5>
                      <p className="text-sm text-gray-600">{candidateProfile?.jobTitle}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {candidateProfile?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {candidateProfile.location}
                          </span>
                        )}
                        {candidateProfile?.yearsExperience && (
                          <span>• {candidateProfile.yearsExperience} years exp</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {candidateProfile?.skills && candidateProfile.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {candidateProfile.skills.slice(0, 8).map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CV */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">CV Attached</p>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        {formData.cvFile ? formData.cvFile.name : 'Current CV on file'}
                      </span>
                    </div>
                  </div>

                  {/* Note */}
                  {formData.noteToEmployer && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Note to Employer</p>
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200">
                        {formData.noteToEmployer}
                      </p>
                    </div>
                  )}

                  {/* Cover Letter */}
                  {formData.includeCoverLetter && formData.coverLetter && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cover Letter</p>
                      <div className="text-sm text-gray-700 bg-white rounded-lg p-4 border border-gray-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {formData.coverLetter}
                      </div>
                    </div>
                  )}
                </div>

                {/* Matching Score Placeholder */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Strong Match</p>
                      <p className="text-sm text-gray-600">Your profile aligns well with this role</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.cvUrl && !formData.cvFile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

// Add missing Building2 import at the top
import { Building2 } from 'lucide-react';
