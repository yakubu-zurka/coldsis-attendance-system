import { AttendanceRecord } from '../types';

export function exportToCSV(records: AttendanceRecord[]) {
  const headers = ['Staff Name', 'Date', 'Time', 'Latitude', 'Longitude', 'Accuracy (m)', 'Timestamp'];
  const rows = records.map(r => [
    r.staffName,
    r.checkInDate,
    r.checkInTime,
    r.latitude.toFixed(6),
    r.longitude.toFixed(6),
    r.accuracy,
    new Date(r.timestamp).toISOString(),
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

export function exportToExcel(records: AttendanceRecord[]) {
  const headers = ['Staff Name', 'Date', 'Time', 'Latitude', 'Longitude', 'Accuracy (m)', 'Timestamp'];

  let html = '<table border="1"><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr>';

  records.forEach(r => {
    html += '<tr>';
    html += `<td>${r.staffName}</td>`;
    html += `<td>${r.checkInDate}</td>`;
    html += `<td>${r.checkInTime}</td>`;
    html += `<td>${r.latitude.toFixed(6)}</td>`;
    html += `<td>${r.longitude.toFixed(6)}</td>`;
    html += `<td>${r.accuracy}</td>`;
    html += `<td>${new Date(r.timestamp).toISOString()}</td>`;
    html += '</tr>';
  });
  html += '</table>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `attendance_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
}

export function exportToPDF(records: AttendanceRecord[]) {
  let html = `
    <html>
      <head>
        <title>RHEMA PREP - Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #1e3a8a; }
          .header p { margin: 5px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1e3a8a; color: white; padding: 12px; text-align: left; font-weight: bold; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .summary { margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #1e3a8a; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RHEMA PREP J.H.S</h1>
          <p>Staff Attendance Report</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Staff Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Accuracy (m)</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr>
                <td>${r.staffName}</td>
                <td>${r.checkInDate}</td>
                <td>${r.checkInTime}</td>
                <td>${r.latitude.toFixed(6)}</td>
                <td>${r.longitude.toFixed(6)}</td>
                <td>${r.accuracy}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <p><strong>Total Records:</strong> ${records.length}</p>
          <p><strong>Unique Staff Members:</strong> ${new Set(records.map(r => r.staffId)).size}</p>
          <p><strong>Date Range:</strong> ${records.length > 0 ? `${records[records.length - 1].checkInDate} to ${records[0].checkInDate}` : 'N/A'}</p>
        </div>
        <div class="footer">
          <p>This is an automated report from RHEMA PREP Attendance Management System</p>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/pdf;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `attendance_${new Date().toISOString().split('T')[0]}.pdf`;
  link.click();
}
