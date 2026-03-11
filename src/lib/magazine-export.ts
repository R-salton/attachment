
'use client';

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  ImageRun, 
  SectionType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
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
 * Utility to convert an image base64 string to a circular avatar using Canvas
 */
async function createCircularAvatar(base64Str: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = base64Str;
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }

      // Draw circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Draw image centered
      const xOffset = (img.width - size) / 2;
      const yOffset = (img.height - size) / 2;
      ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, size, size);

      // Convert to bytes for docx
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      resolve(bytes);
    };
    img.onerror = () => reject(new Error("Image load failed"));
  });
}

/**
 * Shared utility to clean names and aggregate contribution counts
 */
function getProcessedCadetRegistry(articles: ArticleData[]) {
  const cadetRegistry = new Map<string, { 
    name: string, 
    company: string, 
    platoon: string, 
    articleCount: number 
  }>();

  articles.forEach(article => {
    const cleanName = article.cadetName
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
 * Exports multiple articles to a professional, two-column magazine document.
 */
export async function exportMagazineToDocx(articles: ArticleData[]) {
  const sections: any[] = [];
  const uniqueContributors = new Set(articles.map(a => a.cadetName.toUpperCase())).size;

  // Title Section
  sections.push({
    properties: {
      type: SectionType.CONTINUOUS,
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "OFFICER CADET INTAKE 14/25-26",
            bold: true,
            size: 24,
            font: "Arial",
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1000, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "OFFICIAL LITERARY ARCHIVE",
            bold: true,
            size: 48,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        spacing: { after: 1000 },
      }),
    ],
  });

  const companies = ['Alpha', 'Bravo', 'Charlie'];

  for (const companyName of companies) {
    const companyArticles = articles.filter(a => a.company === companyName);
    if (companyArticles.length === 0) continue;

    for (const article of companyArticles) {
      const headerChildren: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: article.cadetName.toUpperCase(),
              bold: true,
              size: 32,
              font: "Arial",
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${article.company} Company | Platoon ${article.platoon}`,
              italic: true,
              size: 18,
              font: "Arial",
              color: "666666",
            }),
          ],
          spacing: { after: 400 },
        }),
        new Paragraph({
          border: {
            bottom: {
              color: "333333",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { after: 400 },
        }),
      ];

      const bodyChildren: any[] = [];

      // Circular Avatar Handling
      if (article.imageUrl) {
        try {
          const avatarBytes = await createCircularAvatar(article.imageUrl);
          bodyChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: avatarBytes,
                  transformation: {
                    width: 140,
                    height: 140,
                  },
                }),
              ],
              spacing: { after: 300 },
              alignment: AlignmentType.LEFT,
            })
          );
        } catch (e) {
          console.error("Circular Avatar Processing Failed:", e);
        }
      }

      const contentLines = article.content.split('\n');
      for (const line of contentLines) {
        if (!line.trim()) {
          bodyChildren.push(new Paragraph({ spacing: { after: 100 } }));
          continue;
        }
        
        bodyChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                size: 20,
                font: "Arial",
              }),
            ],
            spacing: { after: 150 },
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }

      bodyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Official Registry Entry | Filed: ${article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Verified'}`,
              size: 14,
              font: "Arial",
              color: "999999",
              italic: true,
            }),
          ],
          spacing: { before: 600 },
          alignment: AlignmentType.RIGHT,
        })
      );

      sections.push({
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: { top: 1440, right: 1440, bottom: 400, left: 1440 },
          },
        },
        children: headerChildren,
      });

      sections.push({
        properties: {
          type: SectionType.CONTINUOUS,
          column: {
            count: 2,
            space: 720,
          },
          page: {
            margin: { top: 400, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: bodyChildren,
      });
    }
  }

  // Summary Final Page
  const summaryChildren: any[] = [
    new Paragraph({
      children: [new TextRun({ text: "REGISTRY SUMMARY STATISTICS", bold: true, size: 28, underline: {} })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000, after: 600 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "METRIC", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL COUNT", bold: true })] })], shading: { fill: "f1f5f9" } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Literary Contributions" })] }),
            new TableCell({ children: [new Paragraph({ text: articles.length.toString(), alignment: AlignmentType.CENTER })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Total Unique Cadet Submitters" })] }),
            new TableCell({ children: [new Paragraph({ text: uniqueContributors.toString(), alignment: AlignmentType.CENTER })] }),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ 
          text: `\nEnd of Official Archive. Generated on ${new Date().toLocaleDateString('en-GB')}`, 
          italic: true, 
          size: 16,
          color: "666666"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000 },
    }),
  ];

  sections.push({
    properties: { type: SectionType.NEXT_PAGE },
    children: summaryChildren,
  });

  const doc = new Document({ sections });

  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CADET_LITERARY_ARCHIVE_${new Date().toISOString().split('T')[0]}.docx`);
  } catch (error) {
    console.error("DOCX Packing Error:", error);
    throw error;
  }
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
      children: [new TextRun({ text: "LITERARY MAGAZINE CONTRIBUTION REGISTRY", bold: true, size: 24, underline: {} })],
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
              color: "2563eb"
            })
          ],
          spacing: { before: 400, after: 200 },
        })
      );

      const headerRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "S/N", bold: true, size: 20 })], alignment: AlignmentType.CENTER })], shading: { fill: "f1f5f9" }, verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RANK", bold: true, size: 20 })], alignment: AlignmentType.CENTER })], shading: { fill: "f1f5f9" }, verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CADET FULL NAME", bold: true, size: 20 })], alignment: AlignmentType.CENTER })], shading: { fill: "f1f5f9" }, verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NBR OF ARTICLES", bold: true, size: 20 })], alignment: AlignmentType.CENTER })], shading: { fill: "f1f5f9" }, verticalAlign: VerticalAlign.CENTER }),
        ],
      });

      const dataRows = platoonCadets.map((cadet, idx) => {
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: 20 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "OC", size: 20 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cadet.name, size: 20 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cadet.articleCount.toString(), size: 20 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
          ],
        });
      });

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
          spacing: { after: 400 }
        })
      );
    }
  }

  // Summary Footer
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: `\nCOMMAND REGISTRY SUMMARY`, bold: true, size: 20, underline: {} })
      ],
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
    }),
    new Paragraph({
      children: [new TextRun({ text: `\nReport Generated: ${new Date().toLocaleDateString('en-GB')}`, italic: true, size: 16, color: "666666" })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 800 },
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
      },
      children: docChildren,
    }],
  });

  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CADET_CONTRIBUTION_REGISTRY_${new Date().toISOString().split('T')[0]}.docx`);
  } catch (error) {
    console.error("Nominal Roll Export Error:", error);
    throw error;
  }
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
  currentY += 6;
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
