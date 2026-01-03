import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form@7.55.0';
import { toast } from 'sonner@2.0.3';
import { QRCodeModal } from './QRCodeModal';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { StyledQRCode, getStyledQRCodeCanvas } from './StyledQRCode';
import viuraaLogo from 'figma:asset/b42a712e245a52a2a439ee360f63a35caa881a1e.png';
import viuraaIcon from 'figma:asset/4b71f17dd182b69c7051160b5e78a74919a6c8a7.png';
import loadingLogo from 'figma:asset/4b71f17dd182b69c7051160b5e78a74919a6c8a7.png';
import enrollmentBanner from 'figma:asset/b9f6815b3af69c176a4a9dc29f7dc358fcbdc4be.png';
import welcomeImage from 'figma:asset/811d879e6fe3f1c80779fd6802e814ceac4e8073.png';
import { generateEnrollmentPDF } from '../utils/pdfGenerator';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Upload, 
  X, 
  ChevronDown, 
  AlertCircle, 
  Award,
  Download,
  CheckCircle
} from 'lucide-react';

interface InternshipFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedIn?: string;
  
  // Academic Information
  university: string;
  major: string;
  minor?: string;
  yearOfStudy: string;
  expectedGraduation: string;
  gpa: string;
  
  // Internship Preferences
  department: string;
  position: string;
  workType: string;
  
  // Skills & Experience
  skills: string;
  previousExperience?: string;
  coverLetter: string;
  
  // Professional Reference
  referenceName: string;
  referenceTitle: string;
  referenceEmail: string;
  referencePhone: string;
}

export function InternshipRegistrationForm({ announcementText }: { announcementText: string }) {
  const { register, handleSubmit, formState: { errors }, reset, trigger } = useForm<InternshipFormData>({
    mode: 'onBlur',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [referencePhoneCountryCode, setReferencePhoneCountryCode] = useState('+91');
  const [showQRModal, setShowQRModal] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const successSectionRef = useRef<HTMLDivElement>(null);
  const [testMode, setTestMode] = useState(true); // Enable test mode by default
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

  // Scroll to success section when it's shown
  useEffect(() => {
    if (showQRModal && successSectionRef.current) {
      successSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [showQRModal]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      if (!file.type.includes('pdf') && !file.type.includes('doc')) {
        toast.error('Please upload a PDF or DOC file');
        return;
      }
      setResume(file);
    }
  };

  const removeFile = () => {
    setResume(null);
    toast.info('Resume removed');
  };

  const onSubmit = async (data: InternshipFormData) => {
    if (!resume) {
      toast.error('Please upload your resume/CV');
      return;
    }

    setIsSubmitting(true); // Start loading

    try {
      // Generate unique application ID
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9).toUpperCase();
      const appId = `INT-${timestamp}-${randomStr}`;
      const fullName = `${data.firstName} ${data.lastName}`;

      // Combine country code with phone numbers
      const fullPhone = `${phoneCountryCode}${data.phone}`;
      const fullReferencePhone = `${referencePhoneCountryCode}${data.referencePhone}`;

      // Upload resume to Supabase Storage
      const fileExt = resume.name.split('.').pop();
      const fileName = `${appId}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', resume);
      formData.append('filePath', filePath);

      const uploadResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/upload-resume`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Resume upload error:', uploadResponse.status, errorText);
        throw new Error(`Resume upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const { signedUrl } = await uploadResponse.json();

      // Store application data to database
      const applicationData = {
        ...data,
        phone: fullPhone,
        referencePhone: fullReferencePhone,
        applicationId: appId,
        applicantName: fullName,
        submittedAt: new Date().toISOString(),
        resumeFileName: resume.name,
        resumeFileSize: resume.size,
        resumeFilePath: signedUrl || 'No file uploaded',
        testMode: testMode, // Pass test mode to server
      };

      const storeResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/submit-application`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(applicationData),
        }
      );

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        
        // Handle phone number uniqueness error specifically
        if (storeResponse.status === 409) {
          toast.error(errorData.error || 'This phone number is already registered');
          throw new Error(errorData.error || 'Phone number already exists');
        }
        
        const errorText = errorData.error || await storeResponse.text();
        throw new Error(`Application submission failed: ${errorText}`);
      }

      // Show QR code modal
      setApplicationData({
        id: appId,
        name: fullName,
        ...applicationData
      });
      setShowQRModal(true);
      toast.success('Application and resume uploaded successfully!');

      // Reset form
      reset();
      setResume(null);
      setPhoneCountryCode('+91');
      setReferencePhoneCountryCode('+91');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(`Failed to submit application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  const handleCloseModal = () => {
    setShowQRModal(false);
    setApplicationData(null);
  };

  const downloadPDF = async () => {
    if (!applicationData) return;

    try {
      // Generate styled QR code canvas
      const qrCanvas = await getStyledQRCodeCanvas(qrData, viuraaIcon, 256);
      
      await generateEnrollmentPDF(
        applicationData,
        qrCanvas,
        viuraaIcon,
        announcementText
      );
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const qrData = applicationData ? JSON.stringify({
    applicationId: applicationData.id,
    applicantName: applicationData.name,
    type: 'internship-application',
    timestamp: new Date().toISOString()
  }) : '';

  return (
    <>
      {/* Loading Indicator */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md" style={{ background: 'rgba(25, 42, 57, 0.9)' }}>
          <div className="flex flex-col items-center gap-6">
            <img 
              src={loadingLogo} 
              alt="Loading" 
              className="w-32 h-32 animate-spin-slow" 
              style={{ 
                filter: 'drop-shadow(0 0 40px rgba(239, 157, 101, 0.8))',
                animation: 'spin 2s linear infinite, pulse 2s ease-in-out infinite'
              }}
            />
            <p className="text-white text-xl" style={{ textShadow: '0 0 20px rgba(239, 157, 101, 0.6)' }}>
              Submitting your application...
            </p>
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Application Success Section - Shows at top after submission */}
      {showQRModal && applicationData && (
        <div 
          ref={successSectionRef}
          className="backdrop-blur-3xl rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.85) 0%, rgba(25, 42, 57, 0.7) 100%)', 
            border: '2px solid rgba(239, 157, 101, 0.4)',
            boxShadow: '0 25px 50px -12px rgba(239, 157, 101, 0.4), inset 0 2px 30px rgba(239, 157, 101, 0.1)'
          }}>
          {/* Shimmer effect */}
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{
            background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
            animation: 'modalShimmer 3s ease-in-out infinite'
          }}></div>
          
          <div className="text-center mb-6 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 backdrop-blur-xl rounded-full mb-4 relative overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, rgba(239, 157, 101, 0.4) 0%, rgba(239, 157, 101, 0.25) 100%)', 
              border: '2px solid rgba(239, 157, 101, 0.6)',
              boxShadow: '0 8px 32px rgba(239, 157, 101, 0.3), inset 0 2px 20px rgba(239, 157, 101, 0.15)'
            }}>
              <div className="absolute inset-0 rounded-full" style={{
                background: 'radial-gradient(circle, rgba(239, 157, 101, 0.4) 0%, transparent 70%)',
                animation: 'iconPulse 2s ease-in-out infinite'
              }}></div>
              <CheckCircle className="w-8 h-8 relative z-10" style={{ color: '#EF9D65' }} />
            </div>
            <h2 className="text-white mb-2">Application Submitted!</h2>
            <p className="text-gray-300">Your application has been successfully submitted</p>
          </div>

          <div className="backdrop-blur-2xl rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.8) 0%, rgba(25, 42, 57, 0.6) 100%)', 
            border: '1.5px solid rgba(239, 157, 101, 0.3)',
            boxShadow: 'inset 0 1px 20px rgba(239, 157, 101, 0.08)'
          }}>
            <div className="absolute top-0 left-0 right-0 h-px opacity-60" style={{
              background: 'linear-gradient(90deg, transparent, rgba(239, 157, 101, 0.7), transparent)',
              animation: 'slideShimmer 3s ease-in-out infinite'
            }}></div>
            
            <div className="mb-4 relative z-10">
              <p className="text-gray-400 mb-1">Application ID</p>
              <p className="text-white break-all">{applicationData.id}</p>
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 mb-1">Applicant Name</p>
              <p className="text-white">{applicationData.name}</p>
            </div>
          </div>

          <div className="flex flex-col items-center mb-6 relative z-10">
            <p className="text-gray-300 mb-4">Scan this QR code for quick access</p>
            <div className="bg-white p-4 rounded-xl shadow-2xl" style={{ boxShadow: '0 20px 40px rgba(239, 157, 101, 0.3)' }}>
              <StyledQRCode
                data={qrData}
                size={256}
                logoUrl={viuraaIcon}
              />
            </div>
          </div>

          <div className="flex gap-3 relative z-10 justify-center">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition shadow-2xl relative overflow-hidden"
              style={{ 
                background: 'linear-gradient(to right, #EF9D65, #F5B17C)', 
                boxShadow: '0 20px 25px -5px rgba(239, 157, 101, 0.5)'
              }}
            >
              <div className="absolute inset-0 opacity-40" style={{
                background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                animation: 'buttonShimmer 2s ease-in-out infinite'
              }}></div>
              <Download className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Download PDF</span>
            </button>
            <button
              onClick={handleCloseModal}
              className="px-6 py-3 backdrop-blur-xl border-2 rounded-xl text-white hover:bg-white/10 transition"
              style={{ background: 'rgba(25, 42, 57, 0.7)', borderColor: 'rgba(239, 157, 101, 0.5)' }}
            >
              Close
            </button>
          </div>

          <p className="text-gray-400 text-center mt-4 relative z-10">
            Keep this QR code for your Entry
          </p>

          <style>{`
            @keyframes modalShimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            
            @keyframes iconPulse {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
            
            @keyframes slideShimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      )}

      {/* Registration Form */}
      <div className="backdrop-blur-3xl rounded-3xl shadow-2xl p-8 relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.8) 0%, rgba(25, 42, 57, 0.6) 50%, rgba(25, 42, 57, 0.7) 100%)', 
        border: '2px solid rgba(239, 157, 101, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(239, 157, 101, 0.3), inset 0 2px 30px rgba(239, 157, 101, 0.08)'
      }}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{
          background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 55%, transparent 100%)',
          animation: 'shimmer 3s ease-in-out infinite'
        }}></div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative z-10">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2" style={{ borderColor: 'rgba(239, 157, 101, 0.5)' }}>
              <User className="w-6 h-6" style={{ color: '#EF9D65' }} />
              <h2 className="text-white text-xl drop-shadow-lg font-bold uppercase" style={{ fontFamily: 'Iceberg, sans-serif', textShadow: '0 0 30px rgba(239, 157, 101, 0.5)' }}>Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-gray-300 mb-1">
                  First Name <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-gray-300 mb-1">
                  Last Name <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-300 mb-1">
                  Email Address <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="w-full pl-10 pr-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                    style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                    placeholder="john.doe@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-gray-300 mb-1">
                  Phone Number <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-shrink-0" style={{ width: '110px' }}>
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 backdrop-blur-xl border rounded-xl text-white outline-none appearance-none transition"
                      style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+81">🇯🇵 +81</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      {...register('phone', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^\d{10}$/,
                          message: 'Phone number must be exactly 10 digits'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                      style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                      placeholder="1234567890"
                      maxLength={10}
                      onBlur={() => trigger('phone')}
                    />
                  </div>
                </div>
                {errors.phone && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="linkedIn" className="block text-gray-300 mb-1">
                  LinkedIn Profile (Optional)
                </label>
                <input
                  id="linkedIn"
                  type="url"
                  {...register('linkedIn')}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2" style={{ borderColor: 'rgba(239, 157, 101, 0.5)' }}>
              <GraduationCap className="w-6 h-6" style={{ color: '#EF9D65' }} />
              <h2 className="text-white">Academic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="university" className="block text-gray-300 mb-1">
                  University/College <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="university"
                  type="text"
                  {...register('university', { required: 'University is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="University or College"
                />
                {errors.university && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.university.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="major" className="block text-gray-300 mb-1">
                  Major <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="major"
                  type="text"
                  {...register('major', { required: 'Major is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Computer Science"
                />
                {errors.major && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.major.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="minor" className="block text-gray-300 mb-1">
                  Minor (Optional)
                </label>
                <input
                  id="minor"
                  type="text"
                  {...register('minor')}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Mathematics"
                />
              </div>

              <div>
                <label htmlFor="yearOfStudy" className="block text-gray-300 mb-1">
                  Year of Study <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="relative">
                  <select
                    id="yearOfStudy"
                    {...register('yearOfStudy', { required: 'Year of study is required' })}
                    className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white outline-none appearance-none transition"
                    style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  >
                    <option value="">Select Year</option>
                    <option value="freshman">Freshman (1st Year)</option>
                    <option value="sophomore">Sophomore (2nd Year)</option>
                    <option value="junior">Junior (3rd Year)</option>
                    <option value="senior">Senior (4th Year)</option>
                    <option value="graduate">Graduate Student</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.yearOfStudy && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.yearOfStudy.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="expectedGraduation" className="block text-gray-300 mb-1">
                  Expected Graduation <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="expectedGraduation"
                  type="month"
                  {...register('expectedGraduation', { required: 'Expected graduation date is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                />
                {errors.expectedGraduation && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.expectedGraduation.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="gpa" className="block text-gray-300 mb-1">
                  CGPA <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="gpa"
                    type="text"
                    {...register('gpa', { 
                      required: 'CGPA is required',
                      pattern: {
                        value: /^(10(\.0{1,2})?|[0-9](\.\d{1,2})?)$/,
                        message: 'Enter valid CGPA (0.00 - 10.00)'
                      }
                    })}
                    className="w-full pl-10 pr-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                    style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                    placeholder="8.50"
                  />
                </div>
                {errors.gpa && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.gpa.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Internship Preferences Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2" style={{ borderColor: 'rgba(239, 157, 101, 0.5)' }}>
              <Briefcase className="w-6 h-6" style={{ color: '#EF9D65' }} />
              <h2 className="text-white">Internship Preferences</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-gray-300 mb-1">
                  Preferred Department <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="relative">
                  <select
                    id="department"
                    {...register('department', { required: 'Department is required' })}
                    className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white outline-none appearance-none transition"
                    style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  >
                    <option value="">Select Department</option>
                    <option value="software-engineering">Software Engineering</option>
                    <option value="data-science">Data Science & Analytics</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                    <option value="human-resources">Human Resources</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                    <option value="design">Design & UX</option>
                    <option value="product-management">Product Management</option>
                    <option value="customer-success">Customer Success</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.department && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.department.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="position" className="block text-gray-300 mb-1">
                  Preferred Position <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="position"
                  type="text"
                  {...register('position', { required: 'Position is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Software Development Intern"
                />
                {errors.position && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.position.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="workType" className="block text-gray-300 mb-1">
                  Work Type Preference <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="relative">
                  <select
                    id="workType"
                    {...register('workType', { required: 'Work type is required' })}
                    className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white outline-none appearance-none transition"
                    style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  >
                    <option value="">Select Work Type</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.workType && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.workType.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills & Experience Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2" style={{ borderColor: 'rgba(239, 157, 101, 0.5)' }}>
              <FileText className="w-6 h-6" style={{ color: '#EF9D65' }} />
              <h2 className="text-white">Skills & Experience</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="skills" className="block text-gray-300 mb-1">
                  Relevant Skills <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <textarea
                  id="skills"
                  {...register('skills', { required: 'Skills are required' })}
                  rows={3}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition resize-none"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="e.g., JavaScript, React, Python, Project Management..."
                />
                {errors.skills && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.skills.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="previousExperience" className="block text-gray-300 mb-1">
                  Previous Experience (Optional)
                </label>
                <textarea
                  id="previousExperience"
                  {...register('previousExperience')}
                  rows={3}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition resize-none"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Describe any relevant work experience or projects..."
                />
              </div>

              <div>
                <label htmlFor="coverLetter" className="block text-gray-300 mb-1">
                  Cover Letter <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <textarea
                  id="coverLetter"
                  {...register('coverLetter', { required: 'Cover letter is required' })}
                  rows={5}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition resize-none"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Tell us why you're interested in this internship and what makes you a great fit..."
                />
                {errors.coverLetter && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.coverLetter.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-1">
                  Resume/CV Upload <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                
                {!resume ? (
                  <label
                    htmlFor="resume"
                    className="flex flex-col items-center justify-center w-full h-32 backdrop-blur-xl border-2 border-dashed rounded-xl cursor-pointer hover:bg-white/5 transition"
                    style={{ background: 'rgba(25, 42, 57, 0.4)', borderColor: 'rgba(239, 157, 101, 0.4)' }}
                  >
                    <Upload className="w-8 h-8 mb-2" style={{ color: '#EF9D65' }} />
                    <p className="text-gray-300 mb-1">Click to upload resume</p>
                    <p className="text-gray-400">PDF or DOC (Max 10MB)</p>
                    <input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 backdrop-blur-xl border rounded-xl" style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.4)' }}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6" style={{ color: '#EF9D65' }} />
                      <div>
                        <p className="text-white">{resume.name}</p>
                        <p className="text-gray-400">{(resume.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Reference Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2" style={{ borderColor: 'rgba(239, 157, 101, 0.5)' }}>
              <User className="w-6 h-6" style={{ color: '#EF9D65' }} />
              <h2 className="text-white">Professional Reference</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="referenceName" className="block text-gray-300 mb-1">
                  Reference Name <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="referenceName"
                  type="text"
                  {...register('referenceName', { required: 'Reference name is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Dr. Jane Smith"
                />
                {errors.referenceName && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.referenceName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="referenceTitle" className="block text-gray-300 mb-1">
                  Title/Position <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <input
                  id="referenceTitle"
                  type="text"
                  {...register('referenceTitle', { required: 'Reference title is required' })}
                  className="w-full px-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                  style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                  placeholder="Professor"
                />
                {errors.referenceTitle && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.referenceTitle.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="referenceEmail" className="block text-gray-300 mb-1">
                  Email <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="referenceEmail"
                    type="email"
                    {...register('referenceEmail', { 
                      required: 'Reference email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="w-full pl-10 pr-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                    style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                    placeholder="reference@university.edu"
                  />
                </div>
                {errors.referenceEmail && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.referenceEmail.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="referencePhone" className="block text-gray-300 mb-1">
                  Phone Number <span style={{ color: '#EF9D65' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-shrink-0" style={{ width: '110px' }}>
                    <select
                      value={referencePhoneCountryCode}
                      onChange={(e) => setReferencePhoneCountryCode(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 backdrop-blur-xl border rounded-xl text-white outline-none appearance-none transition"
                      style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+81">🇯🇵 +81</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="referencePhone"
                      type="tel"
                      {...register('referencePhone', { 
                        required: 'Reference phone is required',
                        pattern: {
                          value: /^\d{10}$/,
                          message: 'Phone number must be exactly 10 digits'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-2 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none transition"
                      style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
                      placeholder="1234567890"
                      maxLength={10}
                      onBlur={() => trigger('referencePhone')}
                    />
                  </div>
                </div>
                {errors.referencePhone && (
                  <p className="mt-1 flex items-center gap-1" style={{ color: '#EF9D65' }}>
                    <AlertCircle className="w-4 h-4" />
                    {errors.referencePhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="px-12 py-4 rounded-2xl text-white transition shadow-2xl hover:shadow-3xl transform hover:scale-105 relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(to right, #EF9D65, #F5B17C)', 
                boxShadow: '0 20px 25px -5px rgba(239, 157, 101, 0.5), 0 10px 10px -5px rgba(239, 157, 101, 0.4)'
              }}
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{
                background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                animation: 'buttonShimmer 2s ease-in-out infinite'
              }}></div>
              <span className="relative z-10">Submit Application</span>
            </button>
          </div>
        </form>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes buttonShimmer {
            0% { transform: translateX(-200%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    </>
  );
}