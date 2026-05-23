import jsPDF from "jspdf";
import logo from "@/assets/sdmath-logo.png";

export async function generateTrainerCardPDF(opts: {
  fullName: string;
  membershipNumber: string;
  profileImageUrl?: string | null;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [90, 55] });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(247, 250, 250);
  doc.rect(0, 0, w, h, "F");
  doc.setDrawColor(14, 124, 123);
  doc.setLineWidth(1);
  doc.rect(2, 2, w - 4, h - 4);

  try {
    const img = new Image();
    img.src = logo;
    await new Promise((r) => { img.onload = r; img.onerror = r; });
    doc.addImage(img, "PNG", 4, 4, 12, 12);
  } catch {}

  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 79, 78);
  doc.setFontSize(11);
  doc.text("SDMATH", 18, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Trainer Membership Card", 18, 14);

  // Profile image
  if (opts.profileImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = opts.profileImageUrl;
      await new Promise((r) => { img.onload = r; img.onerror = r; });
      doc.addImage(img, "PNG", w - 22, 18, 18, 24);
    } catch {}
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Name / الاسم:", 5, 26);
  doc.setFont("helvetica", "normal");
  doc.text(opts.fullName, 5, 31);

  doc.setFont("helvetica", "bold");
  doc.text("Membership #:", 5, 38);
  doc.setFont("helvetica", "normal");
  doc.text(opts.membershipNumber, 5, 43);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Issued: ${new Date().toLocaleDateString()}`, 5, h - 5);

  doc.save(`SDMATH-Trainer-${opts.membershipNumber}.pdf`);
}
