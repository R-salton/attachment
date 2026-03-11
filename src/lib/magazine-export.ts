'use client';

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  ImageRun, 
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ArticleData {
  cadetName: string;
  company: string;
  platoon: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

/**
 * Sanitizes strings to prevent XML corruption in .docx files.
 * Removes control characters that break the OOXML schema.
 */
function sanitizeForXml(str: string): string {
  if (!str) return "";
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F]/g, "");
}

/**
 * Utility to convert an image base64 string to a circular avatar for Word (Uint8Array).
 */
async function createCircularAvatar(base64Str: string): Promise<Uint8Array | null> {
  if (!base64Str || !base64Str.includes('base64,')) return null;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = base64Str;
    img.onload = () => {
      try {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        const xOffset = (img.width - size) / 2;
        const yOffset = (img.height - size) / 2;
        ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        resolve(bytes);
      } catch (e) {
        console.error("Canvas processing failed", e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
}

/**
 * Aggregates stats for the final summary page.
 */
function getProcessedCadetRegistry(articles: ArticleData[]) {
  const cadetRegistry = new Map<string, { 
    name: string, 
    company: string, 
    platoon: string, 
    articleCount: number 
  }>();

  articles.forEach(article => {
    const cleanName = sanitizeForXml(article.cadetName)
      .replace(/\bOC\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const key = `${article.company}-${article.platoon}-${cleanName}`;
    const existing = cadetRegistry.get(key);

    if (existing) {
      existing.articleCount += 1;
    } else {
      cadetRegistry.set(key, {
        name: cleanName,
        company: article.company,
        platoon: article.platoon,
        articleCount: 1
      });
    }
  });

  return Array.from(cadetRegistry.values());
}

/**
 * Exports multiple articles to a stable Word document.
 * Focuses on MS Office compatibility by using a single section and simple formatting.
 */
export async function exportMagazineToDocx(articles: ArticleData[]) {
  const children: any[] = [
    // Cover Page
    new Paragraph({
      children: [new TextRun({ text: "OFFICER CADET INTAKE 14/25-26", bold: true, size: 28, font: "Arial", color: "444444" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "OFFICIAL LITERARY ARCHIVE", bold: true, size: 56, font: "Arial" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 12 } },
      spacing: { after: 1200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "POLICE TRAINING SCHOOL (PTS) GISHARI", bold: true, size: 24, font: "Arial" })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
  ];

  for (const article of articles) {
    // Header
    children.push(
      new Paragraph({
        children: [new TextRun({ text: sanitizeForXml(article.cadetName).toUpperCase(), bold: true, size: 32, font: "Arial" })],
        spacing: { before: 800, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${article.company} Company | Platoon ${article.platoon}`, italic: true, size: 20, font: "Arial", color: "555555" })],
        spacing: { after: 400 },
      })
    );

    // Image
    if (article.imageUrl) {
      const avatarBytes = await createCircularAvatar(article.imageUrl);
      if (avatarBytes) {
        children.push(new Paragraph({
          children: [
            new ImageRun({ 
              data: avatarBytes, 
              transformation: { width: 100, height: 100 },
              altText: { title: "Cadet Profile", description: "Circular profile image" }
            })
          ],
          spacing: { after: 400 },
        }));
      }
    }

    // Body - Split by lines and create paragraphs for each
    const sanitizedContent = sanitizeForXml(article.content);
    const contentLines = sanitizedContent.split(/\r?\n/);
    for (const line of contentLines) {
      if (line.trim()) {
        children.push(new Paragraph({
          children: [new TextRun({ text: line.trim(), size: 22, font: "Arial" })],
          spacing: { after: 200 },
        }));
      }
    }

    children.push(new Paragraph({
      children: [new TextRun({ text: `Filed: ${article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB') : 'Verified'}`, size: 16, font: "Arial", color: "888888", italic: true })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 800 },
    }));

    children.push(new Paragraph({ 
      border: { bottom: { color: "EEEEEE", style: BorderStyle.SINGLE, size: 4 } }, 
      spacing: { after: 400 } 
    }));
  }

  // Summary Table
  children.push(new Paragraph({ children: [new TextRun({ text: "REGISTRY SUMMARY", bold: true, size: 28 })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 400 } }));
  
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] })
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ text: "Total Articles" })] }),
        new TableCell({ children: [new Paragraph({ text: articles.length.toString() })] })
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ text: "Unique Contributors" })] }),
        new TableCell({ children: [new Paragraph({ text: new Set(articles.map(a => a.cadetName)).size.toString() })] })
      ]})
    ]
  }));

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: children
    }]
  });

  const blob = await Packer.toBlob(doc);
  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(blob, `CADET_REGISTRY_${dateStr}.docx`);
}

/**
 * Exports Magazine to a professional 2-Column PDF.
 */
export async function exportMagazineToPDF(articles: ArticleData[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const colGap = 10;
  const colWidth = (pageWidth - (margin * 2) - colGap) / 2;

  // 1. Cover Page
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("OFFICER CADET INTAKE 14/25-26", pageWidth / 2, pageHeight / 3, { align: 'center' });
  
  doc.setFontSize(32);
  doc.text("OFFICIAL LITERARY", pageWidth / 2, (pageHeight / 3) + 20, { align: 'center' });
  doc.text("ARCHIVE", pageWidth / 2, (pageHeight / 3) + 35, { align: 'center' });
  
  doc.setDrawColor(59, 130, 246); // primary
  doc.setLineWidth(2);
  doc.line(pageWidth / 4, (pageHeight / 3) + 45, (pageWidth / 4) * 3, (pageHeight / 3) + 45);
  
  doc.setFontSize(12);
  doc.text("POLICE TRAINING SCHOOL (PTS) GISHARI", pageWidth / 2, (pageHeight / 3) + 60, { align: 'center' });

  // 2. Articles
  for (const article of articles) {
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    
    // Header Section
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(article.cadetName.toUpperCase(), margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`${article.company} Company | Platoon ${article.platoon}`, margin, 32);
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);

    let currentY = 45;

    // Avatar
    if (article.imageUrl) {
      try {
        doc.saveGraphicsState();
        doc.arc(margin + 15, currentY + 15, 15, 0, Math.PI * 2);
        doc.clip();
        doc.addImage(article.imageUrl, 'JPEG', margin, currentY, 30, 30);
        doc.restoreGraphicsState();
        currentY += 40;
      } catch (e) {
        console.error("PDF Image Error", e);
      }
    }

    // Two Column Content
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const textLines = doc.splitTextToSize(article.content, colWidth);
    const half = Math.ceil(textLines.length / 2);
    const leftCol = textLines.slice(0, half);
    const rightCol = textLines.slice(half);

    doc.text(leftCol, margin, currentY, { maxWidth: colWidth, lineHeightFactor: 1.5 });
    doc.text(rightCol, margin + colWidth + colGap, currentY, { maxWidth: colWidth, lineHeightFactor: 1.5 });
    
    // Footer
    const footerY = Math.max(currentY + (leftCol.length * 5), currentY + (rightCol.length * 5)) + 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`--- Official Registry Record | Filed: ${article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB') : 'Verified'} ---`, pageWidth / 2, footerY, { align: 'center' });
  }

  // 3. Registry Summary
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("COMMAND REGISTRY TOTALS", pageWidth / 2, 30, { align: 'center' });
  
  const statsTable = [
    ["Command Metric", "Value"],
    ["Total Contributions", articles.length.toString()],
    ["Unique Contributors", new Set(articles.map(a => a.cadetName)).size.toString()],
    ["Alpha Company", articles.filter(a => a.company === 'Alpha').length.toString()],
    ["Bravo Company", articles.filter(a => a.company === 'Bravo').length.toString()],
    ["Charlie Company", articles.filter(a => a.company === 'Charlie').length.toString()],
  ];

  autoTable(doc, {
    startY: 45,
    head: [statsTable[0]],
    body: statsTable.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    margin: { left: 40, right: 40 }
  });

  doc.save(`CADET_MAGAZINE_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generates a professional Nominal Roll Organized by Platoon (DOCX)
 */
export async function exportContributionRegistry(articles: ArticleData[]) {
  const uniqueCadets = getProcessedCadetRegistry(articles);
  const companies = ['Alpha', 'Bravo', 'Charlie'];
  const platoons = ['1', '2', '3'];
  const totalArticles = articles.length;

  const docChildren: any[] = [
    new Paragraph({
      children: [new TextRun({ text: "OFFICER CADET INTAKE 14/25-26", bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "LITERARY MAGAZINE CONTRIBUTION REGISTRY", bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
  ];

  for (const company of companies) {
    for (const platoon of platoons) {
      const platoonCadets = uniqueCadets
        .filter(c => c.company === company && c.platoon === platoon)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (platoonCadets.length === 0) continue;

      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: `${company.toUpperCase()} COMPANY - PLATOON ${platoon}`, 
              bold: true, 
              size: 22,
              color: "2563EB"
            })
          ],
          spacing: { before: 400, after: 200 },
        })
      );

      const rows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "S/N", bold: true, size: 20 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RANK", bold: true, size: 20 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CADET FULL NAME", bold: true, size: 20 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NBR OF ARTICLES", bold: true, size: 20 })], alignment: AlignmentType.CENTER })] }),
          ],
        }),
        ...platoonCadets.map((cadet, idx) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: 20 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "OC", size: 20 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cadet.name, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cadet.articleCount.toString(), size: 20 })], alignment: AlignmentType.CENTER })] }),
          ],
        }))
      ];

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows,
        })
      );
    }
  }

  // Summary Footer
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "COMMAND REGISTRY SUMMARY", bold: true, size: 20 })],
      spacing: { before: 600, after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Total Articles Filed: `, bold: true, size: 18 }),
        new TextRun({ text: totalArticles.toString(), size: 18 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Total Unique Contributors: `, bold: true, size: 18 }),
        new TextRun({ text: uniqueCadets.length.toString(), size: 18 }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: docChildren,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `CADET_REGISTRY_${new Date().toISOString().split('T')[0]}.docx`);
}

/**
 * Generates a professional PDF Nominal Roll with summary stats
 */
export async function exportContributionRegistryPDF(articles: ArticleData[]) {
  const uniqueCadets = getProcessedCadetRegistry(articles);
  const doc = new jsPDF();
  const companies = ['Alpha', 'Bravo', 'Charlie'];
  const platoons = ['1', '2', '3'];
  const totalArticles = articles.length;

  // Title Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICER CADET INTAKE 14/25-26', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('LITERARY MAGAZINE CONTRIBUTION REGISTRY', 105, 22, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(40, 24, 170, 24);

  let currentY = 35;

  for (const company of companies) {
    for (const platoon of platoons) {
      const platoonCadets = uniqueCadets
        .filter(c => c.company === company && c.platoon === platoon)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (platoonCadets.length === 0) continue;

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(37, 99, 235);
      doc.text(`${company.toUpperCase()} COMPANY - PLATOON ${platoon}`, 14, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 5;

      const tableData = platoonCadets.map((c, i) => [
        (i + 1).toString(),
        'OC',
        c.name,
        c.articleCount.toString()
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['S/N', 'RANK', 'CADET FULL NAME', 'NBR OF ARTICLES']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          currentY = data.cursor?.y || 20;
        }
      });

      currentY += 15;
    }
  }

  // Summary Section at the end
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 10;
  }

  doc.setDrawColor(200);
  doc.line(14, currentY, 196, currentY);
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMAND REGISTRY TOTALS', 14, currentY);
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Articles Published: ${totalArticles}`, 14, currentY);
  doc.text(`Total Unique Contributors: ${uniqueCadets.length}`, 14, currentY);

  // Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} | Registry Archive: Intake 14/25-26`, 14, 285);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 196, 285, { align: 'right' });
  }

  doc.save(`CADET_CONTRIBUTION_REGISTRY_${new Date().toISOString().split('T')[0]}.pdf`);
}
