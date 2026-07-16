import PDFDocument from "pdfkit";

export async function generateCertificatePdfBuffer(data: {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  verificationUrl: string;
  qrCodeBuffer: Buffer;
  issueDate: string;
  verificationCode: string;
  version: number;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // 1. Draw primary borders
      doc.lineWidth(5);
      doc.rect(20, 20, 801.89, 555.28).stroke("#1B365D"); // Primary Navy Blue
      doc.lineWidth(1.5);
      doc.rect(26, 26, 789.89, 543.28).stroke("#C5A059"); // Accent Gold

      // 2. Headings
      doc.font("Helvetica-Bold").fontSize(28).fillColor("#1B365D").text("IndiWebPros Academy", 40, 60, { align: "center" });
      doc.font("Helvetica").fontSize(10).fillColor("#666666").text("ENTERPRISE LEARNING & TECHNOLOGY SOLUTIONS", 40, 90, { align: "center" });

      // 3. Certificate Title
      doc.font("Helvetica-Bold").fontSize(32).fillColor("#222222").text("CERTIFICATE OF COMPLETION", 40, 140, { align: "center" });

      // 4. Student Presentation
      doc.font("Helvetica").fontSize(14).fillColor("#555555").text("This credential is officially awarded to", 40, 200, { align: "center" });
      doc.font("Helvetica-Bold").fontSize(26).fillColor("#C5A059").text(data.studentName, 40, 222, { align: "center" });

      // 5. Course Completion Detail
      doc.font("Helvetica").fontSize(14).fillColor("#555555").text("for demonstrating expertise and successfully completing all assessments in", 40, 270, { align: "center" });
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#1B365D").text(data.courseName, 40, 292, { align: "center" });

      // 6. Metadata Left Block
      doc.font("Helvetica").fontSize(10).fillColor("#777777").text(`Issue Date: ${data.issueDate}`, 100, 360, { align: "left" });
      doc.font("Helvetica").fontSize(10).fillColor("#777777").text(`Certificate No: ${data.certificateNumber}`, 100, 378, { align: "left" });
      doc.font("Helvetica").fontSize(8).fillColor("#999999").text(`Verification Code: ${data.verificationCode}`, 100, 398, { align: "left" });
      doc.font("Helvetica").fontSize(8).fillColor("#999999").text(`Document Version: ${data.version}.0`, 100, 412, { align: "left" });

      // 7. QR Code Block Right
      doc.image(data.qrCodeBuffer, 620, 345, { width: 100, height: 100 });
      doc.font("Helvetica").fontSize(7).fillColor("#777777").text("Scan to verify validity:", 600, 450, { width: 140, align: "center" });
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#1B365D").text(data.verificationUrl, 600, 460, { width: 140, align: "center" });

      // 8. Signatures bottom line
      doc.lineWidth(1);
      doc.moveTo(100, 495).lineTo(250, 495).stroke("#CCCCCC");
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#222222").text("Mohan Balu", 100, 503, { width: 150, align: "center" });
      doc.font("Helvetica").fontSize(8).fillColor("#666666").text("Founder, IndiWebPros", 100, 515, { width: 150, align: "center" });

      doc.moveTo(350, 495).lineTo(500, 495).stroke("#CCCCCC");
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#222222").text("Authorized Instructor", 350, 503, { width: 150, align: "center" });
      doc.font("Helvetica").fontSize(8).fillColor("#666666").text("Lead Faculty Signatory", 350, 515, { width: 150, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
