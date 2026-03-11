// Export logic based on jsPDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(records: any[]) {
  const headers = ['Staff Name', 'Date', 'Time', 'Latitude', 'Longitude', 'Accuracy (m)', 'Timestamp'];
  const rows = records.map(r => [
    r.staffName,
    r.checkInDate || r.date,
    r.checkInTime,
    r.latitude?.toFixed(6) || "N/A",
    r.longitude?.toFixed(6) || "N/A",
    r.accuracy || "N/A",
    new Date(r.timestamp || r.checkInTimestamp || Date.now()).toISOString(),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportToExcel(records: any[]) {
  const headers = ['Staff Name', 'Date', 'Time', 'Latitude', 'Longitude', 'Accuracy (m)', 'Timestamp'];

  let html = '<table border="1"><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr>';

  records.forEach(r => {
    html += '<tr>';
    html += `<td>${r.staffName}</td>`;
    html += `<td>${r.checkInDate || r.date}</td>`;
    html += `<td>${r.checkInTime}</td>`;
    html += `<td>${r.latitude?.toFixed(6) || "N/A"}</td>`;
    html += `<td>${r.longitude?.toFixed(6) || "N/A"}</td>`;
    html += `<td>${r.accuracy || "N/A"}</td>`;
    html += `<td>${new Date(r.timestamp || r.checkInTimestamp || Date.now()).toISOString()}</td>`;
    html += '</tr>';
  });
  html += '</table>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `attendance_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
}

export function exportToPDF(records: any[]) {
  // Initialize PDF document
  const doc = new jsPDF();
  
  // App styling constants
  const primaryColor: [number, number, number] = [30, 58, 138]; // #1e3a8a
  const secondaryColor: [number, number, number] = [234, 88, 12]; // #ea580c 

  try {
    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("COLDSIS GH", 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Staff Attendance Report", 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    // Divider line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

  // Table Data Preparation
  const tableColumn = ["Staff Name", "Date", "Check In", "Check Out", "Status / Duration"];
  
  const calculateDuration = (inTime?: number, outTime?: number) => {
    if (!inTime || !outTime) return "N/A";
    const diff = outTime - inTime;
    if (diff < 0) return "0h 0m";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 14) return "14h 0m (Max)";
    return `${hours}h ${minutes}m`;
  };

  const tableRows = records.map(record => {
    const isCompleted = !!record.checkOutTime;
    const duration = isCompleted ? calculateDuration(record.checkInTimestamp, record.checkOutTimestamp) : "On Duty";
    
    return [
      record.staffName || "Unknown",
      record.date || record.checkInDate || "N/A",
      record.checkInTime || "--:--",
      record.checkOutTime || "Not Recorded",
      duration
    ];
  });

    // Generate Table
    autoTable(doc, {
      startY: 48,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // #f9fafb
      },
      didParseCell: function(data) {
        // Highlight "On Duty" or "Auto-Closed"
        if (data.section === 'body') {
          if (data.column.index === 3 && data.cell.text[0] === "Auto-Closed") {
            data.cell.styles.textColor = secondaryColor; // Orange
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.column.index === 4 && data.cell.text[0] === "On Duty") {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Summary Section (below the table)
    // In jspdf-autotable, the final Y position is stored in lastAutoTable
    const finalY = (doc as any).lastAutoTable?.finalY || 50;
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("Report Summary:", 14, finalY + 15);
    
    doc.text(`Total Records: ${records.length}`, 14, finalY + 22);
    
    const uniqueStaff = new Set(records.filter(r => r.staffId).map(r => r.staffId)).size;
    doc.text(`Unique Staff Members: ${uniqueStaff}`, 14, finalY + 28);
    
    if (records.length > 0) {
      const sorted = [...records].sort((a, b) => (b.checkInTimestamp || 0) - (a.checkInTimestamp || 0));
      const latestDate = sorted[0].date || sorted[0].checkInDate;
      const oldestDate = sorted[sorted.length - 1].date || sorted[sorted.length - 1].checkInDate;
      doc.text(`Date Range: ${oldestDate}  to  ${latestDate}`, 14, finalY + 34);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount} \u2014 Coldsis GH Attendance System`, 14, doc.internal.pageSize.height - 10);
    }

    // Save the PDF
    doc.save(`coldsis_attendance_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error("PDF Generation failed:", error);
    alert("Failed to generate PDF. Check console for details.");
  }
}
