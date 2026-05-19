import jsPDF from "jspdf";
import QRCode from "qrcode";
import logo from "@/assets/sdmath-logo.png";

export async function generateCertificatePDF(opts: {
  memberName: string;
  examTitle: string;
  score: string;
  date: string;
  certNumber: string;
  verifyUrl: string;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(247, 250, 250);
  doc.rect(0, 0, w, h, "F");

  // Border
  doc.setDrawColor(14, 124, 123);
  doc.setLineWidth(2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, w - 28, h - 28);

  // Logo
  try {
    const img = new Image();
    img.src = logo;
    await new Promise((r) => { img.onload = r; img.onerror = r; });
    doc.addImage(img, "PNG", w / 2 - 15, 22, 30, 30);
  } catch {}

  // Title
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 79, 78);
  doc.setFontSize(32);
  doc.text("CERTIFICATE", w / 2, 70, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("OF ACHIEVEMENT", w / 2, 78, { align: "center" });

  // Body
  doc.setFontSize(12);
  doc.text("This certificate is proudly presented to", w / 2, 100, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(opts.memberName, w / 2, 115, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`for successfully completing the exam: ${opts.examTitle}`, w / 2, 130, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Score: ${opts.score}`, w / 2, 142, { align: "center" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${opts.date}`, 30, h - 25);
  doc.text(`Certificate No: ${opts.certNumber}`, 30, h - 18);
  doc.text("SDMATH Administration", w - 30, h - 25, { align: "right" });

  // QR
  try {
    const qr = await QRCode.toDataURL(opts.verifyUrl, { width: 200 });
    doc.addImage(qr, "PNG", w - 50, h - 60, 30, 30);
  } catch {}

  doc.save(`SDMATH-${opts.certNumber}.pdf`);
}
