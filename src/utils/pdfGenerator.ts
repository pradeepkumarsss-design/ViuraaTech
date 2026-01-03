import jsPDF from 'jspdf';

export const generateEnrollmentPDF = async (
  applicationData: any,
  qrCanvas: HTMLCanvasElement,
  viuraaLogo: string,
  announcementText: string
) => {
  try {
    // Create a new PDF document (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Add background color
    pdf.setFillColor(25, 42, 57);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add decorative border
    pdf.setDrawColor(239, 157, 101);
    pdf.setLineWidth(1);
    pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

    // Add Viuraa logo (no border)
    const logoSize = 30;
    pdf.addImage(viuraaLogo, 'PNG', (pageWidth - logoSize) / 2, margin + 10, logoSize, logoSize);

    // Add title "INTERNSHIP KICKOFF ENROLLMENT"
    let yPos = margin + logoSize + 20;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('INTERNSHIP KICKOFF ENROLLMENT', pageWidth / 2, yPos, { align: 'center' });
    
    // Add welcome message box
    yPos += 15;
    const boxWidth = pageWidth - 2 * margin - 20;
    const boxX = margin + 10;
    
    // Draw welcome box
    pdf.setFillColor(30, 52, 67);
    pdf.setDrawColor(239, 157, 101);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(boxX, yPos, boxWidth, 25, 3, 3, 'FD');
    
    // Add "Viuraa Technova Spark 💐 Heartly Welcome" text - centered
    yPos += 8;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(239, 157, 101);
    pdf.text('Viuraa Technova Spark Heartly Welcome', pageWidth / 2, yPos, { align: 'center' });

    // Add announcement text (college name)
    if (announcementText) {
      yPos += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      // Split long text into multiple lines if needed
      const maxWidth = boxWidth - 10;
      const lines = pdf.splitTextToSize(announcementText.toUpperCase(), maxWidth);
      lines.forEach((line: string) => {
        pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      });
      yPos += 3;
    } else {
      yPos += 15;
    }

    // Add QR code
    yPos += 20;
    const qrSize = 60;
    const qrDataUrl = qrCanvas.toDataURL('image/png');
    pdf.addImage(qrDataUrl, 'PNG', (pageWidth - qrSize) / 2, yPos, qrSize, qrSize);

    // Add application details box
    yPos += qrSize + 15;
    
    // Application ID box
    pdf.setFillColor(30, 52, 67);
    pdf.setDrawColor(239, 157, 101);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin + 10, yPos, pageWidth - 2 * margin - 20, 20, 3, 3, 'FD');
    
    pdf.setFontSize(10);
    pdf.setTextColor(239, 157, 101);
    pdf.text('APPLICATION ID', pageWidth / 2, yPos + 6, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text(applicationData.id, pageWidth / 2, yPos + 14, { align: 'center' });

    // Applicant name box
    yPos += 25;
    pdf.setFillColor(30, 52, 67);
    pdf.setDrawColor(239, 157, 101);
    pdf.roundedRect(margin + 10, yPos, pageWidth - 2 * margin - 20, 20, 3, 3, 'FD');
    
    pdf.setFontSize(10);
    pdf.setTextColor(239, 157, 101);
    pdf.text('APPLICANT NAME', pageWidth / 2, yPos + 6, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text(applicationData.name.toUpperCase(), pageWidth / 2, yPos + 14, { align: 'center' });

    // Add footer text inside border
    const footerYPos = pageHeight - margin - 15;
    pdf.setFontSize(10);
    pdf.setTextColor(200, 200, 200);
    pdf.text('Keep this document for your Entry', pageWidth / 2, footerYPos, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.text('Viuraa Technova - Internship Kickoff Program', pageWidth / 2, footerYPos + 6, { align: 'center' });

    // Save the PDF
    pdf.save(`Viuraa-Internship-Enrollment-${applicationData.id}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};