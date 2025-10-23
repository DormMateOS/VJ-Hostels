import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export const generateOutpassPDF = async (outpass) => {
    try {
        const doc = new jsPDF();
        
        // Add border
        doc.setLineWidth(1);
        doc.rect(5, 5, 200, 287);
        
        // Header
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('STUDENT OUTPASS', 105, 20, { align: 'center' });
        
        // Subheader
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('VJ Hostels', 105, 28, { align: 'center' });
        
        // Line separator
        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);
        
        // Status badge
        const statusColors = {
            'approved': { r: 76, g: 175, b: 80 },
            'out': { r: 255, g: 152, b: 0 }
        };
        const statusColor = statusColors[outpass.status] || { r: 76, g: 175, b: 80 };
        
        doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
        doc.roundedRect(150, 40, 45, 10, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(outpass.status.toUpperCase(), 172.5, 46.5, { align: 'center' });
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
        
        // Student Details Section
        let yPos = 55;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Details', 15, yPos);
        
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        const addField = (label, value) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(String(value), 70, yPos);
            yPos += 8;
        };
        
        addField('Name', outpass.name);
        addField('Roll Number', outpass.rollNumber);
        addField('Student Phone', outpass.studentMobileNumber);
        addField('Parent Phone', outpass.parentMobileNumber);
        
        yPos += 5;
        
        // Outpass Details Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Outpass Details', 15, yPos);
        
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        addField('Type', outpass.type.toUpperCase());
        addField('Out Time', new Date(outpass.outTime).toLocaleString());
        addField('In Time', new Date(outpass.inTime).toLocaleString());
        
        if (outpass.actualOutTime) {
            addField('Actually Left At', new Date(outpass.actualOutTime).toLocaleString());
        }
        
        // Reason section
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Reason:', 20, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const reasonLines = doc.splitTextToSize(outpass.reason, 170);
        doc.text(reasonLines, 20, yPos);
        yPos += (reasonLines.length * 6) + 10;
        
        // Generate QR Code if available
        if (outpass.qrCodeData) {
            try {
                const qrCodeDataUrl = await QRCode.toDataURL(outpass.qrCodeData, {
                    width: 500,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                
                // QR Code section
                yPos = Math.max(yPos, 180); // Ensure QR code has space
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Security QR Code', 105, yPos, { align: 'center' });
                
                yPos += 5;
                
                // Add QR code image
                doc.addImage(qrCodeDataUrl, 'PNG', 70, yPos, 70, 70);
                
                yPos += 75;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.text('Show this QR code at the security gate', 105, yPos, { align: 'center' });
            } catch (qrError) {
                console.error('Error generating QR code:', qrError);
            }
        }
        
        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('This is a digitally generated outpass. No signature required.', 105, 280, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
        
        // Save the PDF
        const fileName = `Outpass_${outpass.rollNumber}_${new Date().getTime()}.pdf`;
        doc.save(fileName);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
