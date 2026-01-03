import { useState, useRef, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { QRCodeCanvas } from 'qrcode.react';
import viuraaLogo from 'figma:asset/b42a712e245a52a2a439ee360f63a35caa881a1e.png';
import viuraaIcon from 'figma:asset/4b71f17dd182b69c7051160b5e78a74919a6c8a7.png';
import { jsPDF } from 'jspdf';
import jsQR from 'jsqr';
import { toast } from 'sonner@2.0.3';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Calendar,
  LogOut,
  LogIn,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  QrCode,
  Camera,
  X,
  MessageSquare,
  Save
} from 'lucide-react';
import { CommentsField } from './CommentsField';

interface Application {
  applicationId: string;
  applicantName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  yearOfStudy: string;
  gpa: string;
  department: string;
  position: string;
  workType: string;
  skills: string;
  resumeFileName: string;
  resumeFilePath: string;
  submittedAt: string;
  referenceName: string;
  referenceTitle: string;
  referenceEmail: string;
  referencePhone: string;
  linkedIn?: string;
  minor?: string;
  expectedGraduation: string;
  previousExperience?: string;
  coverLetter: string;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceStatus?: 'not-checked-in' | 'checked-in' | 'checked-out';
  comments?: string;
  lastCommentUpdate?: string;
}

interface ApplicationsListProps {
  onBack: () => void;
}

export function ApplicationsList({ onBack }: ApplicationsListProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchApplications();
    fetchAnnouncement();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/get-applications`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (applicationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/check-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ applicationId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check in');
      }

      const data = await response.json();
      toast.success(`Checked in successfully at ${new Date(data.checkInTime).toLocaleTimeString()}`);
      
      // Refresh applications list
      await fetchApplications();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async (applicationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/check-out`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ applicationId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check out');
      }

      const data = await response.json();
      toast.success(`Checked out successfully at ${new Date(data.checkOutTime).toLocaleTimeString()}`);
      
      // Refresh applications list
      await fetchApplications();
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Failed to check out');
    }
  };

  const getAttendanceStatus = (app: Application): 'not-checked-in' | 'checked-in' | 'checked-out' => {
    if (app.checkOutTime) return 'checked-out';
    if (app.checkInTime) return 'checked-in';
    return 'not-checked-in';
  };

  const filteredApplications = applications;

  const downloadApplicationPDF = (app: Application) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    pdf.setFillColor(25, 42, 57);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VIURAA', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Internship Application Details', pageWidth / 2, 28, { align: 'center' });

    yPosition = 55;

    // Application ID
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Application ID:', 20, yPosition);
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(app.applicationId, 20, yPosition + 6);
    yPosition += 15;

    // Personal Information
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Personal Information', 20, yPosition);
    yPosition += 8;

    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${app.applicantName}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Email: ${app.email}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Phone: ${app.phone}`, 20, yPosition);
    yPosition += 6;
    if (app.linkedIn) {
      pdf.text(`LinkedIn: ${app.linkedIn}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 5;

    // Academic Information
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Academic Information', 20, yPosition);
    yPosition += 8;

    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`University: ${app.university}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Major: ${app.major}`, 20, yPosition);
    yPosition += 6;
    if (app.minor) {
      pdf.text(`Minor: ${app.minor}`, 20, yPosition);
      yPosition += 6;
    }
    pdf.text(`Year of Study: ${app.yearOfStudy}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`CGPA: ${app.gpa}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Expected Graduation: ${app.expectedGraduation}`, 20, yPosition);
    yPosition += 10;

    // Internship Preferences
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Internship Preferences', 20, yPosition);
    yPosition += 8;

    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Department: ${app.department}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Position: ${app.position}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Work Type: ${app.workType}`, 20, yPosition);
    yPosition += 10;

    // QR Code
    const canvas = document.createElement('canvas');
    const qrData = JSON.stringify({
      applicationId: app.applicationId,
      applicantName: app.applicantName,
      type: 'internship-application',
      timestamp: app.submittedAt
    });
    
    // Generate QR code temporarily
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    import('qrcode.react').then(() => {
      const qrSize = 50;
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width = 220;
      qrCanvas.height = 220;
      const ctx = qrCanvas.getContext('2d');
      
      // Simple fallback - just add text
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 220, 220);
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.fillText('QR Code: ' + app.applicationId, 10, 110);
      }
      
      const qrImageData = qrCanvas.toDataURL('image/png');
      pdf.addImage(qrImageData, 'PNG', (pageWidth - qrSize) / 2, yPosition, qrSize, qrSize);
      
      document.body.removeChild(tempDiv);
      pdf.save(`application-${app.applicationId}.pdf`);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startQRScanner = () => {
    setShowQRScanner(true);
    setScanning(false);
    setCameraError(null);
  };

  const startCamera = async () => {
    try {
      setScanning(true);
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      streamRef.current = stream;
      scanIntervalRef.current = window.setInterval(scanQRCode, 500);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setScanning(false);
      
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access was denied. Please enable camera permissions in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera was found on this device.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('Camera is currently being used by another application. Please close other apps and try again.');
      } else {
        setCameraError('Unable to access camera. Please try again.');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          try {
            const data = JSON.parse(code.data);
            if (data.type === 'internship-application') {
              const app = applications.find(a => a.applicationId === data.applicationId);
              if (app) {
                setSelectedApplication(app);
                stopQRScanner();
                toast.success('Application found!');
              } else {
                toast.error('Application not found');
              }
            } else {
              toast.error('Invalid QR code type');
            }
          } catch (error) {
            console.error('Error parsing QR code data:', error);
            toast.error('Invalid QR code');
          }
        } else {
          toast.error('No QR code found in image');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stopQRScanner = () => {
    setShowQRScanner(false);
    setScanning(false);
    const stream = streamRef.current;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      try {
        const data = JSON.parse(code.data);
        if (data.type === 'internship-application') {
          const app = applications.find(a => a.applicationId === data.applicationId);
          if (app) {
            setSelectedApplication(app);
            stopQRScanner();
          } else {
            toast.error('Application not found');
          }
        }
      } catch (error) {
        console.error('Error parsing QR code data:', error);
        toast.error('Invalid QR code');
      }
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/announcement`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch announcement');
      }

      const data = await response.json();
      setAnnouncementText(data.text || '');
    } catch (error) {
      console.error('Error fetching announcement:', error);
      // Don't show error toast on initial load if there's no announcement yet
    }
  };

  const handleAnnouncementChange = (value: string) => {
    setAnnouncementText(value);
    
    // Clear existing timeout
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    announcementTimeoutRef.current = setTimeout(() => {
      saveAnnouncement(value);
    }, 1000);
  };

  const saveAnnouncement = async (text?: string) => {
    try {
      setSavingAnnouncement(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/announcement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ text: text !== undefined ? text : announcementText }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save announcement');
      }

      // Don't refresh announcement after saving to avoid overwriting while typing
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-3xl rounded-3xl shadow-2xl p-6 relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.85) 0%, rgba(25, 42, 57, 0.7) 100%)', 
        border: '2px solid rgba(239, 157, 101, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(239, 157, 101, 0.4)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-white mb-1">Applications Dashboard</h1>
              <p className="text-gray-300">
                {filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'} found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startQRScanner}
              className="p-3 backdrop-blur-xl border-2 rounded-xl text-white hover:bg-white/10 transition"
              style={{ background: 'rgba(25, 42, 57, 0.7)', borderColor: 'rgba(239, 157, 101, 0.5)' }}
              title="Scan QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-3 backdrop-blur-xl border-2 rounded-xl text-white hover:bg-white/10 transition"
              style={{ background: 'rgba(25, 42, 57, 0.7)', borderColor: 'rgba(239, 157, 101, 0.5)' }}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Announcement Text Input */}
      <div className="backdrop-blur-3xl rounded-3xl shadow-2xl p-6 relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.8) 0%, rgba(25, 42, 57, 0.6) 100%)', 
        border: '2px solid rgba(239, 157, 101, 0.3)'
      }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" style={{ color: '#EF9D65' }} />
              Announcement for Enrollment Page
            </label>
            {savingAnnouncement && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#EF9D65' }}>
                <Save className="w-4 h-4 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
          </div>
          <textarea
            value={announcementText}
            onChange={(e) => handleAnnouncementChange(e.target.value)}
            placeholder="Enter announcement text to display on the enrollment page..."
            rows={3}
            className="w-full px-4 py-3 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none resize-none transition"
            style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
          />
          <p className="text-gray-400 text-sm">
            This text will be displayed to users on the enrollment registration form page.
          </p>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-500 border-t-transparent" style={{ borderTopColor: '#EF9D65' }}></div>
          <p className="text-gray-300 mt-4">Loading applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="backdrop-blur-3xl rounded-3xl shadow-2xl p-12 text-center" style={{ 
          background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.8) 0%, rgba(25, 42, 57, 0.6) 100%)', 
          border: '2px solid rgba(239, 157, 101, 0.3)'
        }}>
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-white mb-2">No Applications Found</h3>
          <p className="text-gray-400">
            No applications have been submitted yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((app) => (
            <div
              key={app.applicationId}
              className="backdrop-blur-3xl rounded-3xl shadow-2xl p-6 relative overflow-hidden hover:shadow-3xl transition-all cursor-pointer group"
              style={{ 
                background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.8) 0%, rgba(25, 42, 57, 0.6) 100%)', 
                border: '2px solid rgba(239, 157, 101, 0.3)'
              }}
              onClick={() => setSelectedApplication(app)}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity" style={{
                background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
                animation: 'shimmer 2s ease-in-out infinite'
              }}></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EF9D65, #F5B17C)' }}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white">{app.applicantName}</h3>
                      <p className="text-gray-400">{app.applicationId}</p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{app.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{app.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{app.university} - {app.major}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{app.position} ({app.workType})</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(app.submittedAt)}</span>
                  </div>
                </div>

                {/* Tags & Attendance Status */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 rounded-full backdrop-blur-xl border text-white" style={{ background: 'rgba(239, 157, 101, 0.2)', borderColor: 'rgba(239, 157, 101, 0.4)' }}>
                    CGPA: {app.gpa}
                  </span>
                  <span className="px-3 py-1 rounded-full backdrop-blur-xl border text-white" style={{ background: 'rgba(239, 157, 101, 0.2)', borderColor: 'rgba(239, 157, 101, 0.4)' }}>
                    {app.yearOfStudy}
                  </span>
                  {(() => {
                    const status = getAttendanceStatus(app);
                    return (
                      <span 
                        className="px-3 py-1 rounded-full backdrop-blur-xl border text-white flex items-center gap-1.5" 
                        style={{ 
                          background: status === 'checked-out' ? 'rgba(239, 68, 68, 0.2)' : status === 'checked-in' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                          borderColor: status === 'checked-out' ? 'rgba(239, 68, 68, 0.4)' : status === 'checked-in' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(156, 163, 175, 0.4)'
                        }}
                      >
                        {status === 'checked-out' ? <XCircle className="w-3.5 h-3.5" /> : status === 'checked-in' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {status === 'checked-out' ? 'Checked Out' : status === 'checked-in' ? 'Checked In' : 'Not Checked In'}
                      </span>
                    );
                  })()}
                </div>

                {/* Check In/Out Buttons */}
                <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                  {getAttendanceStatus(app) === 'not-checked-in' && (
                    <button
                      onClick={() => handleCheckIn(app.applicationId)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white transition shadow-lg"
                      style={{ background: 'linear-gradient(to right, #22C55E, #16A34A)' }}
                    >
                      <LogIn className="w-4 h-4" />
                      Check In
                    </button>
                  )}
                  {getAttendanceStatus(app) === 'checked-in' && (
                    <button
                      onClick={() => handleCheckOut(app.applicationId)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white transition shadow-lg"
                      style={{ background: 'linear-gradient(to right, #EF4444, #DC2626)' }}
                    >
                      <LogOut className="w-4 h-4" />
                      Check Out
                    </button>
                  )}
                  {getAttendanceStatus(app) === 'checked-out' && (
                    <div className="flex-1 text-center py-2.5 px-4 rounded-xl backdrop-blur-xl border text-gray-400" style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}>
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Session Completed</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Attendance Times */}
                {(app.checkInTime || app.checkOutTime) && (
                  <div className="mt-3 text-sm space-y-1">
                    {app.checkInTime && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In: {new Date(app.checkInTime).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {app.checkOutTime && (
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Out: {new Date(app.checkOutTime).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* View Details Link */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t text-gray-400 group-hover:text-white transition" style={{ borderColor: 'rgba(239, 157, 101, 0.2)' }}>
                  <span>View Full Details</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedApplication(null)}
        >
          <div 
            className="backdrop-blur-3xl rounded-3xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            style={{ 
              background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.95) 0%, rgba(25, 42, 57, 0.9) 100%)', 
              border: '2px solid rgba(239, 157, 101, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute top-6 right-6 p-2 backdrop-blur-xl border rounded-lg hover:bg-white/10 transition"
              style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
            >
              <span className="text-white text-xl">×</span>
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-white mb-2">Application Details</h2>
                <p className="text-gray-400">{selectedApplication.applicationId}</p>
              </div>

              {/* Personal Information */}
              <div className="backdrop-blur-2xl rounded-2xl p-6" style={{ 
                background: 'rgba(25, 42, 57, 0.6)', 
                border: '1.5px solid rgba(239, 157, 101, 0.3)'
              }}>
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: '#EF9D65' }} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="text-white">{selectedApplication.applicantName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <p className="text-white">{selectedApplication.phone}</p>
                  </div>
                  {selectedApplication.linkedIn && (
                    <div>
                      <span className="text-gray-400">LinkedIn:</span>
                      <a href={selectedApplication.linkedIn} target="_blank" rel="noopener noreferrer" className="text-white hover:underline flex items-center gap-1">
                        {selectedApplication.linkedIn}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div className="backdrop-blur-2xl rounded-2xl p-6" style={{ 
                background: 'rgba(25, 42, 57, 0.6)', 
                border: '1.5px solid rgba(239, 157, 101, 0.3)'
              }}>
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" style={{ color: '#EF9D65' }} />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <span className="text-gray-400">University:</span>
                    <p className="text-white">{selectedApplication.university}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Major:</span>
                    <p className="text-white">{selectedApplication.major}</p>
                  </div>
                  {selectedApplication.minor && (
                    <div>
                      <span className="text-gray-400">Minor:</span>
                      <p className="text-white">{selectedApplication.minor}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Year of Study:</span>
                    <p className="text-white">{selectedApplication.yearOfStudy}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">CGPA:</span>
                    <p className="text-white">{selectedApplication.gpa}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Expected Graduation:</span>
                    <p className="text-white">{selectedApplication.expectedGraduation}</p>
                  </div>
                </div>
              </div>

              {/* Internship Preferences */}
              <div className="backdrop-blur-2xl rounded-2xl p-6" style={{ 
                background: 'rgba(25, 42, 57, 0.6)', 
                border: '1.5px solid rgba(239, 157, 101, 0.3)'
              }}>
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" style={{ color: '#EF9D65' }} />
                  Internship Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <span className="text-gray-400">Department:</span>
                    <p className="text-white">{selectedApplication.department}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Position:</span>
                    <p className="text-white">{selectedApplication.position}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Work Type:</span>
                    <p className="text-white">{selectedApplication.workType}</p>
                  </div>
                </div>
              </div>

              {/* Skills & Experience */}
              <div className="backdrop-blur-2xl rounded-2xl p-6" style={{ 
                background: 'rgba(25, 42, 57, 0.6)', 
                border: '1.5px solid rgba(239, 157, 101, 0.3)'
              }}>
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: '#EF9D65' }} />
                  Skills & Experience
                </h3>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <span className="text-gray-400">Skills:</span>
                    <p className="text-white mt-1">{selectedApplication.skills}</p>
                  </div>
                  {selectedApplication.previousExperience && (
                    <div>
                      <span className="text-gray-400">Previous Experience:</span>
                      <p className="text-white mt-1">{selectedApplication.previousExperience}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Cover Letter:</span>
                    <p className="text-white mt-1">{selectedApplication.coverLetter}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Resume:</span>
                    <a 
                      href={selectedApplication.resumeFilePath} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:underline flex items-center gap-2 mt-1"
                    >
                      {selectedApplication.resumeFileName}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Attendance Information */}
              <div className="backdrop-blur-2xl rounded-2xl p-6" style={{ 
                background: 'rgba(25, 42, 57, 0.6)', 
                border: '1.5px solid rgba(239, 157, 101, 0.3)'
              }}>
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: '#EF9D65' }} />
                  Attendance Tracking
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    {(() => {
                      const status = getAttendanceStatus(selectedApplication);
                      return (
                        <span 
                          className="px-4 py-2 rounded-full backdrop-blur-xl border text-white flex items-center gap-2" 
                          style={{ 
                            background: status === 'checked-out' ? 'rgba(239, 68, 68, 0.2)' : status === 'checked-in' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                            borderColor: status === 'checked-out' ? 'rgba(239, 68, 68, 0.4)' : status === 'checked-in' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(156, 163, 175, 0.4)'
                          }}
                        >
                          {status === 'checked-out' ? <XCircle className="w-4 h-4" /> : status === 'checked-in' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          {status === 'checked-out' ? 'Checked Out' : status === 'checked-in' ? 'Checked In' : 'Not Checked In'}
                        </span>
                      );
                    })()}
                  </div>
                  {selectedApplication.checkInTime && (
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">Check-In Time:</span>
                      <span className="text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {formatDate(selectedApplication.checkInTime)}
                      </span>
                    </div>
                  )}
                  {selectedApplication.checkOutTime && (
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-gray-400">Check-Out Time:</span>
                      <span className="text-red-400 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {formatDate(selectedApplication.checkOutTime)}
                      </span>
                    </div>
                  )}
                  {selectedApplication.checkInTime && selectedApplication.checkOutTime && (
                    <div className="flex items-center justify-between text-gray-300 pt-2 border-t" style={{ borderColor: 'rgba(239, 157, 101, 0.2)' }}>
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">
                        {(() => {
                          const duration = new Date(selectedApplication.checkOutTime).getTime() - new Date(selectedApplication.checkInTime).getTime();
                          const hours = Math.floor(duration / (1000 * 60 * 60));
                          const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${minutes}m`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Reference */}
              <div className="backdrop-blur-2xl rounded-2xl p-6" style={{ 
                background: 'rgba(25, 42, 57, 0.6)', 
                border: '1.5px solid rgba(239, 157, 101, 0.3)'
              }}>
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: '#EF9D65' }} />
                  Professional Reference
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="text-white">{selectedApplication.referenceName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Title:</span>
                    <p className="text-white">{selectedApplication.referenceTitle}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{selectedApplication.referenceEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <p className="text-white">{selectedApplication.referencePhone}</p>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="backdrop-blur-2xl rounded-2xl p-6" style={{ 
                background: 'rgba(25, 42, 57, 0.6)', 
                border: '1.5px solid rgba(239, 157, 101, 0.3)'
              }}>
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" style={{ color: '#EF9D65' }} />
                  Comments
                </h3>
                <CommentsField
                  applicationId={selectedApplication.applicationId}
                  initialComments={selectedApplication.comments || ''}
                  onCommentsSaved={(comments) => {
                    // Update the local state with new comments
                    setSelectedApplication(prev => prev ? {...prev, comments} : null);
                    // Update in the applications list
                    setApplications(prev => prev.map(app => 
                      app.applicationId === selectedApplication.applicationId 
                        ? {...app, comments} 
                        : app
                    ));
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center flex-wrap">
                {getAttendanceStatus(selectedApplication) === 'not-checked-in' && (
                  <button
                    onClick={() => {
                      handleCheckIn(selectedApplication.applicationId);
                      setSelectedApplication(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition shadow-2xl"
                    style={{ background: 'linear-gradient(to right, #22C55E, #16A34A)' }}
                  >
                    <LogIn className="w-5 h-5" />
                    Check In
                  </button>
                )}
                {getAttendanceStatus(selectedApplication) === 'checked-in' && (
                  <button
                    onClick={() => {
                      handleCheckOut(selectedApplication.applicationId);
                      setSelectedApplication(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition shadow-2xl"
                    style={{ background: 'linear-gradient(to right, #EF4444, #DC2626)' }}
                  >
                    <LogOut className="w-5 h-5" />
                    Check Out
                  </button>
                )}
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-6 py-3 backdrop-blur-xl border-2 rounded-xl text-white hover:bg-white/10 transition"
                  style={{ background: 'rgba(25, 42, 57, 0.7)', borderColor: 'rgba(239, 157, 101, 0.5)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => stopQRScanner()}
        >
          <div 
            className="backdrop-blur-3xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full relative"
            style={{ 
              background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.95) 0%, rgba(25, 42, 57, 0.9) 100%)', 
              border: '2px solid rgba(239, 157, 101, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => stopQRScanner()}
              className="absolute top-6 right-6 p-2 backdrop-blur-xl border rounded-lg hover:bg-white/10 transition z-10"
              style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #EF9D65, #F5B17C)' }}>
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-white mb-2">Scan QR Code</h2>
                <p className="text-gray-400">Choose a method to scan the application QR code</p>
              </div>

              {/* Camera View - Only show when scanning */}
              {scanning && (
                <div className="relative rounded-2xl overflow-hidden border-2" style={{ borderColor: 'rgba(239, 157, 101, 0.3)' }}>
                  <video
                    ref={videoRef}
                    className="w-full h-auto max-h-96 object-cover"
                    autoPlay
                    playsInline
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-white/30 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl" style={{ borderColor: '#EF9D65' }}></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl" style={{ borderColor: '#EF9D65' }}></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl" style={{ borderColor: '#EF9D65' }}></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl" style={{ borderColor: '#EF9D65' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="backdrop-blur-xl rounded-xl p-4 border-2 border-red-500/30 flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-300">
                    <p className="font-semibold mb-1">Camera Access Error</p>
                    <p>{cameraError}</p>
                  </div>
                </div>
              )}

              {/* Instructions when not scanning */}
              {!scanning && !cameraError && (
                <div className="backdrop-blur-xl rounded-xl p-6 border text-center" style={{ background: 'rgba(25, 42, 57, 0.6)', borderColor: 'rgba(239, 157, 101, 0.3)' }}>
                  <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-300 mb-2">Position the QR code within the camera frame</p>
                  <p className="text-gray-400 text-sm">The scanner will automatically detect and process the QR code</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Camera Button */}
                {!scanning ? (
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white transition shadow-xl"
                    style={{ background: 'linear-gradient(to right, #EF9D65, #F5B17C)' }}
                  >
                    <Camera className="w-5 h-5" />
                    Start Scanning
                  </button>
                ) : (
                  <button
                    onClick={stopQRScanner}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white transition shadow-xl"
                    style={{ background: 'linear-gradient(to right, #EF4444, #DC2626)' }}
                  >
                    <XCircle className="w-5 h-5" />
                    Stop Scanning
                  </button>
                )}
              </div>

              {/* Help Text */}
              <div className="text-center text-gray-400 text-sm">
                <p>Point your camera at the QR code on the application form</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}