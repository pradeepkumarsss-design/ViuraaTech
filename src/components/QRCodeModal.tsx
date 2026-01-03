import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, CheckCircle } from 'lucide-react';
import viuraaLogo from 'figma:asset/b42a712e245a52a2a439ee360f63a35caa881a1e.png';
import viuraaIcon from 'figma:asset/4b71f17dd182b69c7051160b5e78a74919a6c8a7.png';
import { jsPDF } from 'jspdf';

interface QRCodeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
  applicationDetails: any;
}

export function QRCodeModal({ onClose, applicationId, applicantName, applicationDetails }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadApplicationPDF = async () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with Viuraa branding
    pdf.setFillColor(25, 42, 57);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Add logo instead of text
    const logoImg = new Image();
    logoImg.src = viuraaIcon;
    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });
    const logoSize = 25;
    pdf.addImage(viuraaIcon, 'PNG', (pageWidth - logoSize) / 2, 7.5, logoSize, logoSize);
    
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Internship Application', pageWidth / 2, 28, { align: 'center' });

    yPosition = 55;

    // Application Submitted! Title
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Application Submitted!', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Your application has been successfully submitted', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Application ID Box
    pdf.setFillColor(25, 42, 57);
    pdf.setDrawColor(239, 157, 101);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, yPosition, pageWidth - 30, 20, 3, 3, 'FD');
    
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Application ID', 20, yPosition + 8);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(applicationId, 20, yPosition + 15);

    yPosition += 30;

    // Applicant Name Box
    pdf.setFillColor(25, 42, 57);
    pdf.roundedRect(15, yPosition, pageWidth - 30, 12, 3, 3, 'FD');
    
    pdf.setTextColor(239, 157, 101);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Applicant Name', 20, yPosition + 8);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(applicantName, 80, yPosition + 8);

    yPosition += 20;

    // Add QR Code
    const qrImageData = canvas.toDataURL('image/png');
    const qrSize = 50;
    pdf.addImage(qrImageData, 'PNG', (pageWidth - qrSize) / 2, yPosition, qrSize, qrSize);
    
    yPosition += qrSize + 5;
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Scan this QR code for quick access', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Keep this QR code for your Entry', pageWidth / 2, yPosition, { align: 'center' });

    // New Page for Application Details
    pdf.addPage();
    yPosition = 20;

    // Application Details Header
    pdf.setFillColor(239, 157, 101);
    pdf.rect(0, 10, pageWidth, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Application Details', pageWidth / 2, 20, { align: 'center' });

    yPosition = 35;

    // Section function
    const addSection = (title: string, fields: {label: string, value: string}[]) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFillColor(25, 42, 57);
      pdf.setDrawColor(239, 157, 101);
      pdf.rect(15, yPosition, pageWidth - 30, 8, 'FD');
      pdf.setTextColor(239, 157, 101);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 20, yPosition + 5.5);
      yPosition += 12;

      fields.forEach(field => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(field.label, 20, yPosition);
        yPosition += 5;

        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(field.value || 'N/A', pageWidth - 40);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      });

      yPosition += 5;
    };

    // Personal Information
    addSection('Personal Information', [
      { label: 'Name', value: `${applicationDetails.firstName} ${applicationDetails.lastName}` },
      { label: 'Email', value: applicationDetails.email },
      { label: 'Phone', value: applicationDetails.phone },
      { label: 'LinkedIn', value: applicationDetails.linkedIn || 'Not provided' }
    ]);

    // Academic Information
    const yearLabels: Record<string, string> = {
      'freshman': 'Freshman (1st Year)',
      'sophomore': 'Sophomore (2nd Year)',
      'junior': 'Junior (3rd Year)',
      'senior': 'Senior (4th Year)',
      'graduate': 'Graduate Student'
    };

    addSection('Academic Information', [
      { label: 'University/College', value: applicationDetails.university },
      { label: 'Major', value: applicationDetails.major },
      { label: 'Minor', value: applicationDetails.minor || 'Not provided' },
      { label: 'Year of Study', value: yearLabels[applicationDetails.yearOfStudy] || applicationDetails.yearOfStudy },
      { label: 'Expected Graduation', value: applicationDetails.expectedGraduation },
      { label: 'CGPA', value: applicationDetails.gpa }
    ]);

    // Internship Preferences
    const deptLabels: Record<string, string> = {
      'software-engineering': 'Software Engineering',
      'data-science': 'Data Science & Analytics',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'human-resources': 'Human Resources',
      'finance': 'Finance',
      'operations': 'Operations',
      'design': 'Design & UX',
      'product-management': 'Product Management',
      'customer-success': 'Customer Success'
    };

    const workTypeLabels: Record<string, string> = {
      'remote': 'Remote',
      'onsite': 'On-site',
      'hybrid': 'Hybrid'
    };

    addSection('Internship Preferences', [
      { label: 'Preferred Department', value: deptLabels[applicationDetails.department] || applicationDetails.department },
      { label: 'Preferred Position', value: applicationDetails.position },
      { label: 'Work Type Preference', value: workTypeLabels[applicationDetails.workType] || applicationDetails.workType }
    ]);

    // Skills & Experience
    addSection('Skills & Experience', [
      { label: 'Relevant Skills', value: applicationDetails.skills },
      { label: 'Previous Experience', value: applicationDetails.previousExperience || 'Not provided' },
      { label: 'Cover Letter', value: applicationDetails.coverLetter }
    ]);

    // Resume
    addSection('Resume/CV', [
      { label: 'File Name', value: applicationDetails.resumeFileName },
      { label: 'File Size', value: `${(applicationDetails.resumeFileSize / 1024).toFixed(2)} KB` }
    ]);

    // Professional Reference
    addSection('Professional Reference', [
      { label: 'Reference Name', value: applicationDetails.referenceName },
      { label: 'Title/Position', value: applicationDetails.referenceTitle },
      { label: 'Email', value: applicationDetails.referenceEmail },
      { label: 'Phone', value: applicationDetails.referencePhone }
    ]);

    // Footer
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = pageHeight - 25;
    } else {
      yPosition = pageHeight - 25;
    }

    pdf.setDrawColor(239, 157, 101);
    pdf.setLineWidth(0.5);
    pdf.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 5;

    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Generated by Viuraa Internship Application System', pageWidth / 2, yPosition, { align: 'center' });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition + 4, { align: 'center' });

    // Save PDF
    pdf.save(`internship-application-${applicationId}.pdf`);
  };

  const qrData = JSON.stringify({
    applicationId,
    applicantName,
    type: 'internship-application',
    timestamp: new Date().toISOString()
  });

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 relative overflow-hidden" style={{ background: 'rgba(25, 42, 57, 0.9)' }}>
      {/* Liquid glass animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full blur-3xl opacity-40" style={{ 
          background: 'radial-gradient(circle, rgba(239, 157, 101, 0.3) 0%, transparent 70%)',
          animation: 'modalFloat 6s ease-in-out infinite'
        }}></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-3xl opacity-40" style={{ 
          background: 'radial-gradient(circle, rgba(239, 157, 101, 0.25) 0%, transparent 70%)',
          animation: 'modalFloat 8s ease-in-out infinite reverse'
        }}></div>
      </div>
      
      <div className="backdrop-blur-3xl rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, rgba(25, 42, 57, 0.85) 0%, rgba(25, 42, 57, 0.7) 100%)', 
        border: '2px solid rgba(239, 157, 101, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(239, 157, 101, 0.4), inset 0 2px 30px rgba(239, 157, 101, 0.1)'
      }}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{
          background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
          animation: 'modalShimmer 3s ease-in-out infinite'
        }}></div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition backdrop-blur-xl z-10"
          style={{ background: 'rgba(25, 42, 57, 0.8)', border: '1.5px solid rgba(239, 157, 101, 0.5)' }}
        >
          <X className="w-5 h-5" style={{ color: '#EF9D65' }} />
        </button>

        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 backdrop-blur-xl rounded-full mb-4 relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, rgba(239, 157, 101, 0.4) 0%, rgba(239, 157, 101, 0.25) 100%)', 
            border: '2px solid rgba(239, 157, 101, 0.6)',
            boxShadow: '0 8px 32px rgba(239, 157, 101, 0.3), inset 0 2px 20px rgba(239, 157, 101, 0.15)'
          }}>
            {/* Icon glow effect */}
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
          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px opacity-60" style={{
            background: 'linear-gradient(90deg, transparent, rgba(239, 157, 101, 0.7), transparent)',
            animation: 'slideShimmer 3s ease-in-out infinite'
          }}></div>
          
          <div className="mb-4 relative z-10">
            <p className="text-gray-400 mb-1">Application ID</p>
            <p className="text-white break-all">{applicationId}</p>
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 mb-1">Applicant Name</p>
            <p className="text-white">{applicantName}</p>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6 relative z-10">
          <p className="text-gray-300 mb-4">Scan this QR code for quick access</p>
          <div ref={qrRef} className="relative bg-white p-4 rounded-2xl shadow-2xl" style={{
            boxShadow: '0 20px 40px rgba(239, 157, 101, 0.2), inset 0 2px 10px rgba(0, 0, 0, 0.05)'
          }}>
            <QRCodeCanvas
              value={qrData}
              size={220}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: viuraaLogo,
                height: 44,
                width: 44,
                excavate: true,
              }}
              style={{
                height: '220px',
                width: '220px'
              }}
              fgColor="#6B2B5E"
              bgColor="#FFFFFF"
            />
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            onClick={downloadApplicationPDF}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition shadow-2xl relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(to right, #EF9D65, #F5B17C)', 
              boxShadow: '0 20px 25px -5px rgba(239, 157, 101, 0.5)'
            }}
          >
            {/* Button shimmer effect */}
            <div className="absolute inset-0 opacity-40" style={{
              background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
              animation: 'buttonShimmer 2s ease-in-out infinite'
            }}></div>
            <Download className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Download Application</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 backdrop-blur-xl border-2 rounded-xl text-white hover:bg-white/10 transition"
            style={{ background: 'rgba(25, 42, 57, 0.7)', borderColor: 'rgba(239, 157, 101, 0.5)' }}
          >
            Close
          </button>
        </div>

        <p className="text-gray-400 text-center mt-4 relative z-10">
          Keep this QR code for your Entry
        </p>
      </div>
      
      <style>{`
        @keyframes modalFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        
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
        
        @keyframes buttonShimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}