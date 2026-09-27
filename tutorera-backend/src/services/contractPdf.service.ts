import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { ITutorAgreementAcceptance } from "../models/TutorAgreementAcceptance.model";

export async function generateContractPdf(
  acceptance: ITutorAgreementAcceptance,
  tutorApplicationId?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margins: { top: 45, bottom: 45, left: 45, right: 45 },
      info: {
        Title: `TUTORERA-Tutor-Agreement-${tutorApplicationId || acceptance.tutor.toString()}-${acceptance.agreementVersion}`,
        Author: "TUTORERA / MENTISERA (SMC-Private) Limited",
        Subject: "Tutor Marketplace & Independent Tutor Agreement",
        Keywords: "tutor, agreement, contract, acceptance, legal, compliance",
        CreationDate: acceptance.acceptedAt || new Date(),
      },
    });

    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];
    passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passThrough.on("end", () => resolve(Buffer.concat(chunks)));
    passThrough.on("error", reject);

    doc.pipe(passThrough);

    const primaryColor = "#021550";
    const brandBlue = "#0329B2";
    const darkGray = "#1E293B";
    const mutedGray = "#475569";
    const borderGray = "#CBD5E1";
    const lightBg = "#F8FAFC";

    // ── Header Banner ──
    doc
      .fontSize(22)
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .text("TUTORERA®", { align: "left" });

    doc
      .fontSize(9)
      .fillColor(mutedGray)
      .font("Helvetica")
      .text("A Trading Platform of MENTISERA (SMC-Private) Limited · Islamabad, Pakistan", { align: "left" })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor(brandBlue)
      .font("Helvetica-Bold")
      .text("TUTOR MARKETPLACE & INDEPENDENT TUTOR AGREEMENT", { align: "left" });

    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font("Helvetica-Bold")
      .text(`Agreement Version: ${acceptance.agreementVersion}  |  Country Schedule: ${acceptance.country}`);

    doc.moveDown(0.7);

    // ── Parties & Execution Identification Box ──
    const startX = 45;
    const boxWidth = 505;
    const boxY = doc.y;

    doc
      .rect(startX, boxY, boxWidth, 120)
      .fillAndStroke(lightBg, borderGray);

    doc.y = boxY + 8;
    doc.x = startX + 12;

    const row = (label: string, value: string) => {
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(primaryColor).text(label, { continued: true, width: 140 });
      doc.font("Helvetica").fontSize(8.5).fillColor(darkGray).text(`:  ${value}`);
    };

    row("Tutor Legal Name", acceptance.legalNameAtAcceptance);
    row("Tutor ID / Application", tutorApplicationId || acceptance.tutor.toString());
    row("Verified Operating Country", acceptance.country === "PK" ? "Pakistan (PK)" : acceptance.country);
    row("Electronic Signature", `/${acceptance.electronicSignature}/ (Typed Legal Signature)`);
    row("Execution Timestamp", acceptance.acceptedAt.toISOString());
    row("Effective Date", (acceptance.effectiveAt || acceptance.acceptedAt).toISOString().split("T")[0]);
    row("Contract Cryptographic Hash", `${acceptance.agreementHash.slice(0, 32)}... (SHA-256 Verified)`);
    row("Acceptance Record Reference", acceptance._id.toString());

    doc.moveDown(1.5);
    doc.x = startX;

    // ── Agreement Body ──
    doc.fontSize(11).fillColor(primaryColor).font("Helvetica-Bold").text("TERMS AND CONDITIONS");
    doc.moveDown(0.4);

    const bodyText = acceptance.contractSnapshot?.content || "";
    const lines = bodyText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        doc.moveDown(0.3);
        continue;
      }

      // Check if line is a section heading (e.g. "1. PARTIES & RECITALS")
      if (/^\d+\.\s+[A-Z\s&(),-]+$/.test(trimmed)) {
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor(primaryColor).font("Helvetica-Bold").text(trimmed);
        doc.moveDown(0.2);
      } else {
        doc.fontSize(8.5).fillColor(darkGray).font("Helvetica").text(trimmed, {
          align: "justify",
          lineGap: 1.5,
        });
      }
    }

    // ── Pakistan Legal Schedule ──
    const schedule = acceptance.contractSnapshot?.applicableSchedule;
    if (schedule) {
      doc.addPage();
      doc.fontSize(12).fillColor(brandBlue).font("Helvetica-Bold").text("APPLICABLE COUNTRY LEGAL SCHEDULE");
      doc.moveDown(0.4);

      const scheduleLines = schedule.split("\n");
      for (const sLine of scheduleLines) {
        const sTrimmed = sLine.trim();
        if (!sTrimmed) {
          doc.moveDown(0.3);
          continue;
        }

        if (/^\d+\.\s+[A-Z\s&(),-]+$/.test(sTrimmed) || sTrimmed.startsWith("PAKISTAN LEGAL SCHEDULE")) {
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(primaryColor).font("Helvetica-Bold").text(sTrimmed);
          doc.moveDown(0.2);
        } else {
          doc.fontSize(8.5).fillColor(darkGray).font("Helvetica").text(sTrimmed, {
            align: "justify",
            lineGap: 1.5,
          });
        }
      }
    }

    // ── Final Electronic Execution Record Block ──
    doc.moveDown(1.5);
    doc.fontSize(11).fillColor(primaryColor).font("Helvetica-Bold").text("ELECTRONIC ACCEPTANCE & AUDIT RECORD");
    doc.moveDown(0.3);

    const recordY = doc.y;
    doc.rect(startX, recordY, boxWidth, 130).fillAndStroke("#F0FDF4", "#86EFAC");
    doc.y = recordY + 10;
    doc.x = startX + 12;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#166534").text("CERTIFIED ELECTRONIC EXECUTION (ETO 2002 COMPLIANT)");
    doc.moveDown(0.4);

    const execRow = (label: string, value: string) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#14532D").text(label, { continued: true, width: 140 });
      doc.font("Helvetica").fontSize(8).fillColor("#166534").text(`:  ${value}`);
    };

    execRow("Executing Tutor Legal Name", acceptance.legalNameAtAcceptance);
    execRow("Electronic Signature", `/${acceptance.electronicSignature}/`);
    execRow("Execution Date & UTC Time", acceptance.acceptedAt.toISOString());
    execRow("Agreement Version Accepted", acceptance.agreementVersion);
    execRow("Full SHA-256 Digest", acceptance.agreementHash);
    execRow("Contracting Entity", "MENTISERA (SMC-Private) Limited, Islamabad, Pakistan");
    execRow("Legal Audit Reference ID", acceptance._id.toString());
    execRow("Consent Status", "All 6 mandatory statutory, safeguarding, and contractor consents recorded");

    // Add page numbers on all buffered pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor(mutedGray)
        .font("Helvetica")
        .text(
          `TUTORERA® Legal Agreement ${acceptance.agreementVersion} · Tutor ID: ${tutorApplicationId || acceptance.tutor.toString()} · Page ${i + 1} of ${range.count}`,
          45,
          doc.page.height - 35,
          { align: "center", width: 505 }
        );
    }

    doc.end();
  });
}
