import jsPDF from "jspdf";

type Msg = { role: "user" | "assistant"; content: string };

export function downloadTranscriptPdf(messages: Msg[], language: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += fontSize * 0.5;
    }
    y += 2;
  };

  addText(`${language} Lesson Transcript`, 18, true, [20, 80, 80]);
  addText(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, 10, false, [100, 100, 100]);
  y += 6;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  for (const msg of messages) {
    const speaker = msg.role === "user" ? "You" : "Tom Holland";
    const color: [number, number, number] = msg.role === "user" ? [30, 100, 160] : [20, 120, 100];
    addText(`${speaker}:`, 11, true, color);
    addText(msg.content, 10, false, [40, 40, 40]);
    y += 4;
  }

  doc.save(`${language.toLowerCase()}-transcript-${Date.now()}.pdf`);
}

export function downloadFeedbackPdf(feedback: string, transcript: Msg[], language: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += fontSize * 0.5;
    }
    y += 2;
  };

  // Feedback report
  const feedbackLines = feedback.split("\n");
  for (const line of feedbackLines) {
    if (line.match(/^[A-Z ]{4,}$/) || line.includes("====") || line.includes("----")) {
      if (line.includes("====") || line.includes("----")) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;
      } else {
        y += 4;
        addText(line, 13, true, [20, 80, 80]);
      }
    } else if (line.trim()) {
      addText(line, 10, false, [40, 40, 40]);
    } else {
      y += 3;
    }
  }

  // Append transcript
  doc.addPage();
  y = 20;
  addText("FULL CONVERSATION TRANSCRIPT", 14, true, [20, 80, 80]);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  for (const msg of transcript) {
    const speaker = msg.role === "user" ? "Student" : "Tom Holland";
    const color: [number, number, number] = msg.role === "user" ? [30, 100, 160] : [20, 120, 100];
    addText(`${speaker}:`, 11, true, color);
    addText(msg.content, 10, false, [40, 40, 40]);
    y += 4;
  }

  doc.save(`${language.toLowerCase()}-feedback-report-${Date.now()}.pdf`);
}
