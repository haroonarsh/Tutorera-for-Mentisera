import Booking from "../models/Booking.model";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import logger from "../config/logger";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { COLORS } from "../utils/emailBrand";
import crypto from "crypto";
import PayoutReport from "../models/PayoutReport.model";

export async function getPayoutReportById(reportId: string): Promise<PayoutReportData | null> {
  const report = await PayoutReport.findOne({ reportId, expiresAt: { $gt: new Date() } }).lean();
  if (!report) return null;
  const calculatedDigest = crypto.createHash("sha256").update(JSON.stringify(report.snapshot)).digest("hex");
  if (calculatedDigest !== report.digest) {
    logger.error({ reportId }, "Payout report snapshot digest mismatch");
    return null;
  }
  return { ...(report.snapshot as unknown as PayoutReportData), digest: report.digest };
}

export interface PayoutLineItem {
  bookingId: string;
  subject: string;
  payoutDate: Date;
  grossAmount: number;
  tutorFee: number;
  taxOnFee: number;
  netPayout: number;
  currency: string;
}

export interface PayoutReportData {
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  grossAmount: number;
  netPayout: number;
  platformFee: number;
  taxOnFee: number;
  totalDeduction: number;
  effectiveTakeHomePercent: number;
  sessionsCompleted: number;
  hoursTaught: number;
  subjectsTaught: string[];
  studentFeedback?: number;
  paymentDate: Date | null;
  reportReference: string;
  complianceStatus: "verified" | "pending" | "rejected";
  verificationUrl: string;
  qrCodeUrl: string;
  reportId: string;
  pdfUrl: string;
  generatedAt: Date;
  expiresAt: Date;
  transactions: PayoutLineItem[];
  digest?: string;
}

export function resolvePayoutReportPeriod(from?: unknown, to?: unknown): { periodStart: Date; periodEnd: Date } {
  const periodEnd = to ? new Date(String(to)) : new Date();
  const periodStart = from ? new Date(String(from)) : new Date(periodEnd);
  if (!from) periodStart.setFullYear(periodStart.getFullYear() - 1);
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
    throw Object.assign(new Error("Use a valid payout report date range."), { statusCode: 400 });
  }
  if (periodEnd.getTime() - periodStart.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw Object.assign(new Error("Payout reports are limited to a 12-month period."), { statusCode: 400 });
  }
  periodEnd.setHours(23, 59, 59, 999);
  return { periodStart, periodEnd };
}

export async function generateTutorPayoutReport(
  tutorId: string,
  periodStart: Date,
  periodEnd: Date,
  generatedBy?: { userId?: string; role: "admin" | "tutor" },
  requestedCurrency?: string
): Promise<{ data: PayoutReportData; pdfBuffer: Buffer }> {
  try {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== "tutor") {
      throw Object.assign(new Error("Tutor not found."), { statusCode: 404 });
    }

    const tutorProfile = await TutorProfile.findOne({ user: tutor._id });
    if (!tutorProfile) {
      throw Object.assign(new Error("Tutor profile not found."), { statusCode: 404 });
    }

    const paidBookings = await Booking.find({
      tutor: tutor._id,
      status: "completed",
      payoutStatus: "paid",
      $or: [
        { payoutPaidAt: { $gte: periodStart, $lte: periodEnd } },
        { payoutPaidAt: { $exists: false }, updatedAt: { $gte: periodStart, $lte: periodEnd } },
      ],
    })
      .populate("student", "name")
      .populate("request", "subject sessionDurationMinutes")
      .lean();

    const normalizedCurrency = requestedCurrency?.trim().toUpperCase();
    if (normalizedCurrency && !/^[A-Z]{3}$/.test(normalizedCurrency)) {
      throw Object.assign(new Error("Use a valid three-letter report currency."), { statusCode: 400 });
    }
    const availableCurrencies = [...new Set(paidBookings.map(booking => booking.currency || "PKR"))];
    if (!normalizedCurrency && availableCurrencies.length > 1) {
      throw Object.assign(new Error("Select a currency before generating a multi-currency payout report."), { statusCode: 400 });
    }
    const currency = normalizedCurrency || availableCurrencies[0] || "PKR";
    const completedBookings = paidBookings.filter(booking => (booking.currency || "PKR") === currency);

    const payoutData = await calculatePayoutData(completedBookings);

    const reportId = crypto.randomBytes(16).toString("hex");
    const apiBaseUrl = process.env.PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1";
    const reportUrl = `${apiBaseUrl}/public/verify/report/${reportId}`;

    const reportData: PayoutReportData = {
      tutorId,
      tutorName: tutor.name,
      tutorEmail: tutor.email,
      currency,
      periodStart,
      periodEnd,
      grossAmount: payoutData.grossAmount,
      netPayout: payoutData.netPayout,
      platformFee: payoutData.platformFee,
      taxOnFee: payoutData.taxOnFee,
      totalDeduction: payoutData.totalDeduction,
      effectiveTakeHomePercent: payoutData.effectiveTakeHomePercent,
      sessionsCompleted: payoutData.sessionsCompleted,
      hoursTaught: payoutData.hoursTaught,
      subjectsTaught: payoutData.subjectsTaught,
      studentFeedback: payoutData.studentFeedback,
      paymentDate: payoutData.paymentDate,
      reportReference: `RPT-${reportId.substring(0, 12).toUpperCase()}`,
      complianceStatus: tutorProfile.verificationStatus === "approved" ? "verified" : "pending",
      verificationUrl: reportUrl,
      qrCodeUrl: reportUrl,
      reportId,
      pdfUrl: "",
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      transactions: payoutData.transactions,
    };

    const snapshot = { ...reportData };
    delete snapshot.digest;
    const digest = crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
    reportData.digest = digest;
    await PayoutReport.create({
      reportId,
      tutor: tutor._id,
      generatedBy: generatedBy?.userId,
      generatedByRole: generatedBy?.role || "tutor",
      periodStart,
      periodEnd,
      snapshot: snapshot as unknown as Record<string, unknown>,
      digest,
      expiresAt: reportData.expiresAt,
    });

    const pdfBuffer = await generateReportPDF(reportData);

    return { data: reportData, pdfBuffer };
  } catch (error) {
    logger.error({ err: error, tutorId }, "Failed to generate payout report");
    throw error;
  }
}

export async function calculatePayoutData(bookings: any[]) {
  const grossAmount = bookings.reduce((sum, booking) => sum + (booking.subtotal ?? booking.amount ?? 0), 0);
  const platformFee = bookings.reduce((sum, booking) => sum + (booking.tutorFee ?? 0), 0);
  const taxOnFee = bookings.reduce((sum, booking) => sum + (booking.tax ?? 0), 0);
  const totalDeduction = platformFee + taxOnFee;
  const netPayout = bookings.reduce((sum, booking) => sum + (booking.tutorNet ?? booking.tutorPayout ?? 0), 0);

  const sessionsCompleted = bookings.length;
  const hoursTaught = bookings.reduce((sum, booking) => {
    const minutes = (booking.request as any)?.sessionDurationMinutes || 0;
    return sum + minutes / 60;
  }, 0);
  const subjectsTaught = [...new Set(bookings.map(b => (b.request as any)?.subject).filter(Boolean))];
  const transactions: PayoutLineItem[] = bookings.map((booking) => ({
    bookingId: booking._id.toString(),
    subject: (booking.request as any)?.subject || "Tutoring session",
    payoutDate: booking.payoutPaidAt || booking.updatedAt,
    grossAmount: booking.subtotal ?? booking.amount ?? 0,
    tutorFee: booking.tutorFee ?? 0,
    taxOnFee: booking.tax ?? 0,
    netPayout: booking.tutorNet ?? booking.tutorPayout ?? 0,
    currency: booking.currency || "PKR",
  }));

  return {
    grossAmount,
    netPayout,
    platformFee,
    taxOnFee,
    totalDeduction,
    effectiveTakeHomePercent: grossAmount > 0 ? (netPayout / grossAmount) * 100 : 0,
    sessionsCompleted,
    hoursTaught: Math.round(hoursTaught * 10) / 10,
    subjectsTaught,
    studentFeedback: undefined,
    paymentDate: transactions.length ? new Date(Math.max(...transactions.map((item) => new Date(item.payoutDate).getTime()))) : null,
    transactions,
  };
}

export async function generateReportPDF(data: PayoutReportData): Promise<Buffer> {
  const qrCodeDataUrl = await QRCode.toDataURL(data.qrCodeUrl, {
    width: 150,
    margin: 2,
    color: {
      dark: COLORS.deepNavy,
      light: "#FFFFFF",
    },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `TUTORERA-Payout-Report-${data.tutorId}-${Date.now()}`,
        Author: "TUTORERA",
        Subject: "Official Tutor Payout Report",
        Keywords: "payout, payment, tutor, report",
        CreationDate: new Date(),
      },
    });

    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];
    passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passThrough.on("end", () => resolve(Buffer.concat(chunks)));
    passThrough.on("error", reject);

    doc.pipe(passThrough);

    addReportHeader(doc);
    addTutorInfoSection(doc, data);
    addPayoutSummary(doc, data);
    addTaxBreakdownSection(doc, data);
    addLineItemsSection(doc, data);
    addVerificationSection(doc, data, qrCodeDataUrl);
    const pageRange = doc.bufferedPageRange();
    for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageIndex);
      addFooter(doc, data, pageIndex + 1, pageRange.count);
    }

    doc.end();
  });
}

function addReportHeader(doc: any): void {
  const pageWidth = doc.page.width;

  doc
    .rect(0, 0, pageWidth, 60)
    .fill(COLORS.deepNavy);

  doc
    .fill(COLORS.cyan)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("TUTORERA", 50, 15, { align: "center", width: pageWidth - 100 });

  doc
    .fill(COLORS.footerText)
    .font("Helvetica")
    .fontSize(11)
    .text("Official Payout Report", 50, 42, { align: "center", width: pageWidth - 100 });

  doc.y = 88;
}

function addTutorInfoSection(doc: any, data: PayoutReportData): void {
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.deepNavy)
    .text("Tutor Information")
    .moveDown(0.5);

  const infoItems = [
    { label: "Tutor ID", value: data.tutorId },
    { label: "Full Name", value: data.tutorName },
    { label: "Email", value: data.tutorEmail },
    { label: "Report Reference", value: data.reportReference },
    { label: "Latest Payout Date", value: data.paymentDate ? data.paymentDate.toLocaleDateString("en-PK") : "No paid payouts in period" },
    { label: "Payout Period", value: `${data.periodStart.toLocaleDateString("en-PK")} - ${data.periodEnd.toLocaleDateString("en-PK")}` },
    { label: "Compliance Status", value: data.complianceStatus },
  ];

  infoItems.forEach((item, index) => {
    const rowY = doc.y;
    const labelX = index % 2 === 0 ? 50 : 310;
    if (index > 0 && index % 2 === 0) doc.y += 20;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.deepNavy)
      .text(`${item.label}:`, labelX, doc.y, { width: 95 });
    doc.font("Helvetica").fillColor(COLORS.text)
      .text(String(item.value), labelX + 95, doc.y, { width: 155 });
    if (index % 2 !== 0) doc.y = rowY;
  });
  doc.y += 30;
}

function addPayoutSummary(doc: any, data: PayoutReportData): void {
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.deepNavy)
    .text("Payout Summary")
    .moveDown(0.5);

  const currentY = doc.y;
  doc
    .rect(50, currentY, 500, 170)
    .fill(COLORS.card)
    .stroke()
    .strokeColor(COLORS.cardBorder);

  let y = currentY + 15;

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.royalBlue)
    .text(`Net Payout: ${data.currency} ${data.netPayout.toLocaleString()}`, 65, y, { align: "center", width: 470 });

  const summaryItems = [
    { label: "Gross Amount", value: `${data.currency} ${data.grossAmount.toLocaleString()}` },
    { label: "Tutor Service Fee", value: `${data.currency} ${data.platformFee.toLocaleString()}` },
    { label: "Tax on Tutor Fee", value: `${data.currency} ${data.taxOnFee.toLocaleString()}` },
    { label: "Total Deductions", value: `${data.currency} ${data.totalDeduction.toLocaleString()}` },
    { label: "Period", value: `${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}` },
    { label: "Sessions Completed", value: data.sessionsCompleted.toString() },
    { label: "Hours Taught", value: `${data.hoursTaught} hrs` },
  ];

  y += 25;
  summaryItems.forEach((item, index) => {
    const columnX = index % 2 === 0 ? 75 : 310;
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.text)
      .text(`${item.label}:`, columnX, y, { width: 105 });
    doc.font("Helvetica-Bold").fillColor(COLORS.deepNavy)
      .text(item.value, columnX + 105, y, { width: 120 });
    if (index % 2 !== 0 || index === summaryItems.length - 1) y += 28;
  });

  doc.y = currentY + 185;
}

function addTaxBreakdownSection(doc: any, data: PayoutReportData): void {
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.deepNavy)
    .text("Tax & Fee Breakdown")
    .moveDown(0.5);

  const feePercent = data.grossAmount > 0 ? (data.platformFee / data.grossAmount) * 100 : 0;
  const taxPercent = data.platformFee > 0 ? (data.taxOnFee / data.platformFee) * 100 : 0;
  const deductionPercent = data.grossAmount > 0 ? (data.totalDeduction / data.grossAmount) * 100 : 0;
  const taxItems = [
    { label: "Gross Payout Amount", value: `${data.currency} ${data.grossAmount.toLocaleString()}`, rate: "100%", category: "Base" },
    { label: "Tutor Service Fee", value: `${data.currency} ${data.platformFee.toLocaleString()}`, rate: `${feePercent.toFixed(1)}%`, category: "Stored snapshot" },
    { label: "Tax on Tutor Fee", value: `${data.currency} ${data.taxOnFee.toLocaleString()}`, rate: `${taxPercent.toFixed(1)}% of fee`, category: "Stored snapshot" },
    { label: "Total Deductions", value: `${data.currency} ${data.totalDeduction.toLocaleString()}`, rate: `${deductionPercent.toFixed(1)}% effective`, category: "Combined" },
    { label: "Net Payout (Take-Home)", value: `${data.currency} ${data.netPayout.toLocaleString()}`, rate: `${data.effectiveTakeHomePercent.toFixed(1)}%`, category: "Net" },
  ];

  let y = doc.y;

  taxItems.forEach((item) => {
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.text)
      .text(`${item.label} [${item.category}]`, 55, y, { width: 230 });
    doc.font("Helvetica-Bold").fillColor(COLORS.deepNavy)
      .text(`${item.value} (${item.rate})`, 300, y, { width: 240, align: "right" });
    y += 22;
  });

  doc.y = y + 10;
}

function addLineItemsSection(doc: any, data: PayoutReportData): void {
  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.deepNavy).text("Paid Payout Line Items").moveDown(0.6);
  if (data.transactions.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted).text("No completed, paid payouts were recorded in this period.");
    return;
  }

  data.transactions.forEach((item, index) => {
    if (doc.y > doc.page.height - 100) doc.addPage();
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.deepNavy)
      .text(`${index + 1}. ${item.subject} - ${new Date(item.payoutDate).toLocaleDateString("en-PK")}`);
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.text)
      .text(`Booking ${item.bookingId} | Gross ${item.currency} ${item.grossAmount.toLocaleString()} | Fee ${item.currency} ${item.tutorFee.toLocaleString()} | Tax ${item.currency} ${item.taxOnFee.toLocaleString()} | Net ${item.currency} ${item.netPayout.toLocaleString()}`)
      .moveDown(0.7);
  });
}

function addVerificationSection(doc: any, data: PayoutReportData, qrCodeDataUrl: string): void {
  doc.addPage();

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.deepNavy)
    .text("Verification & Security")
    .moveDown(0.5);

  const qrSize = 120;
  const qrX = (doc.page.width - qrSize) / 2;
  const qrY = doc.y;
  doc.image(qrCodeDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
  doc.y = qrY + qrSize + 14;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text("Scan QR code to verify payout", { align: "center" })
    .moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(`Verification URL: ${data.verificationUrl}`, { align: "center" })
    .moveDown(0.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.gold)
    .text("Verification controls:")
    .moveDown(0.5);

  const securityFeatures = [
    `Persistent verification record: ${data.reportReference}`,
    `SHA-256 snapshot digest: ${data.digest || "Unavailable"}`,
    "QR code links to the server-side report record",
    `Verification expires on ${data.expiresAt.toLocaleDateString("en-PK")}`,
    "Amounts come from stored booking fee snapshots",
  ];

  securityFeatures.forEach((feature) => {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(`- ${feature}`)
      .moveDown(0.3);
  });
}

function addFooter(doc: any, data: PayoutReportData, pageNumber: number, pageCount: number): void {
  const footerY = doc.page.height - 60;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.footerMuted)
    .text(
      `TUTORERA payout statement | ${data.reportReference} | Page ${pageNumber} of ${pageCount} | hello@mentisera.pk`,
      50,
      footerY,
      { align: "center", width: 495, lineBreak: false }
    );
}
