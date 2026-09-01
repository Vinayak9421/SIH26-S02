import { jsPDF } from 'jspdf'

/**
 * Generates and directly downloads an official Citizen Complaint Receipt PDF.
 */
export function downloadComplaintReceiptPDF(complaint) {
  if (!complaint) return

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  const contentWidth = pageWidth - margin * 2

  // Background Header Banner
  doc.setFillColor(33, 82, 255) // Primary Blue
  doc.rect(0, 0, pageWidth, 38, 'F')

  // Header Title
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('CIVICISSUE AI', margin, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Smart Civic Grievance Management System · SIH 2026', margin, 26)
  doc.text('Official Citizen Complaint & Tracking Receipt', margin, 32)

  // Receipt Meta Box (Right aligned in header)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 18, { align: 'right' })
  doc.text('Status: OFFICIAL COPY', pageWidth - margin, 26, { align: 'right' })

  let y = 48

  // Tracking ID & Status Banner
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F')
  doc.setDrawColor(220, 225, 235)
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'S')

  doc.setTextColor(50, 60, 80)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('COMPLAINT REFERENCE ID', margin + 6, y + 9)

  doc.setFont('courier', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(33, 82, 255)
  doc.text(`#${complaint.id || 'N/A'}`, margin + 6, y + 18)

  // Status Badge on Right
  const status = (complaint.status || 'pending').toUpperCase().replace(/_/g, ' ')
  let statusBg = [255, 237, 213] // orange
  let statusText = [194, 65, 12]
  if (status === 'RESOLVED') {
    statusBg = [220, 252, 231]
    statusText = [22, 101, 52]
  } else if (status === 'IN PROGRESS') {
    statusBg = [219, 234, 254]
    statusText = [30, 64, 175]
  }

  doc.setFillColor(...statusBg)
  doc.roundedRect(pageWidth - margin - 45, y + 6, 39, 12, 2, 2, 'F')
  doc.setTextColor(...statusText)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(status, pageWidth - margin - 25.5, y + 14, { align: 'center' })

  y += 32

  // Section 1: Complaint Details
  doc.setTextColor(20, 25, 40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('1. Grievance Description & Location', margin, y)
  y += 4
  doc.setDrawColor(200, 205, 215)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 110, 125)
  doc.text('GRIEVANCE TEXT:', margin, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 35, 45)
  const splitText = doc.splitTextToSize(complaint.text || 'No text provided', contentWidth)
  doc.text(splitText, margin, y)
  y += splitText.length * 5 + 4

  // Address & Date Grid
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 110, 125)
  doc.text('LOCATION / ADDRESS:', margin, y)
  doc.text('SUBMISSION DATE:', margin + contentWidth / 2, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 35, 45)
  const address = complaint.address || (complaint.latitude && complaint.longitude ? `GPS: ${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}` : 'Location captured via GPS')
  doc.text(address, margin, y, { maxWidth: contentWidth / 2 - 4 })
  const dateStr = complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'
  doc.text(dateStr, margin + contentWidth / 2, y)
  y += 12

  // Section 2: AI Intelligence & Routing
  doc.setTextColor(20, 25, 40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('2. AI Categorization & Department Routing', margin, y)
  y += 4
  doc.setDrawColor(200, 205, 215)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // 3-Column Box Grid
  const boxW = (contentWidth - 8) / 3
  
  // Col 1: Department
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, y, boxW, 20, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 110, 125)
  doc.text('ASSIGNED DEPARTMENT', margin + 4, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(33, 82, 255)
  doc.text(complaint.department || complaint.category || 'General Administration', margin + 4, y + 14, { maxWidth: boxW - 8 })

  // Col 2: Priority
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin + boxW + 4, y, boxW, 20, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 110, 125)
  doc.text('PRIORITY ASSESSMENT', margin + boxW + 8, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const prio = (complaint.priority || 'medium').toUpperCase()
  doc.setTextColor(prio === 'CRITICAL' || prio === 'HIGH' ? 220 : 50, prio === 'CRITICAL' ? 38 : 100, prio === 'CRITICAL' ? 38 : 150)
  doc.text(`${prio} (Score: ${complaint.priority_score || 0})`, margin + boxW + 8, y + 14)

  // Col 3: Duplicate Status / Issue Link
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin + (boxW + 4) * 2, y, boxW, 20, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 110, 125)
  doc.text('ISSUE CONSOLIDATION', margin + (boxW + 4) * 2 + 4, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(complaint.duplicate_state === 'linked' ? 'Linked to Active Issue' : 'Independent Ticket', margin + (boxW + 4) * 2 + 4, y + 14, { maxWidth: boxW - 8 })

  y += 28

  // Section 3: Status History & Timeline
  doc.setTextColor(20, 25, 40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('3. Audit & Resolution History', margin, y)
  y += 4
  doc.setDrawColor(200, 205, 215)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  const timeline = complaint.timeline && complaint.timeline.length > 0
    ? complaint.timeline
    : [{ status: 'submitted', note: 'Complaint received and queued for department processing', created_at: complaint.created_at }]

  timeline.forEach((item, idx) => {
    doc.setFillColor(33, 82, 255)
    doc.circle(margin + 3, y + 2.5, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text((item.status || 'Update').toUpperCase().replace(/_/g, ' '), margin + 8, y + 3)

    if (item.created_at) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 130, 145)
      doc.text(new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), pageWidth - margin, y + 3, { align: 'right' })
    }

    y += 6
    if (item.note) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(70, 80, 95)
      const noteLines = doc.splitTextToSize(item.note, contentWidth - 10)
      doc.text(noteLines, margin + 8, y)
      y += noteLines.length * 4.5 + 2
    } else {
      y += 3
    }
  })

  // Section 4: Citizen Satisfaction Rating (if exists)
  if (complaint.satisfaction_rating) {
    y += 4
    doc.setFillColor(254, 243, 199)
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F')
    doc.setTextColor(146, 64, 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`CITIZEN SATISFACTION: ${'★'.repeat(complaint.satisfaction_rating)}${'☆'.repeat(5 - complaint.satisfaction_rating)} (${complaint.satisfaction_rating}/5 Stars)`, margin + 6, y + 7)
    if (complaint.satisfaction_feedback) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Feedback: "${complaint.satisfaction_feedback}"`, margin + 6, y + 13, { maxWidth: contentWidth - 12 })
    }
    y += 20
  }

  // Footer Note & Verification
  const footerY = 280
  doc.setDrawColor(220, 225, 235)
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140, 150, 165)
  doc.text('This is a computer-generated civic receipt. No physical signature is required.', margin, footerY - 3)
  doc.text('CivicIssue AI · Smart India Hackathon 2026', pageWidth - margin, footerY - 3, { align: 'right' })

  // Trigger direct download
  const cleanId = (complaint.id || 'receipt').slice(0, 8)
  doc.save(`CivicIssue_Receipt_${cleanId}.pdf`)
}
