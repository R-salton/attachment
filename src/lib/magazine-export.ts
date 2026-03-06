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

interface ArticleData {
  cadetName: string;
  company: string;
  platoon: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

/**
 * Exports multiple articles to a modern, magazine-style .docx file.
 */
export async function exportMagazineToDocx(articles: ArticleData[]) {
  const sections: any[] = [];

  // 1. Cover / Intro Section
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
            text: "LITERARY MAGAZINE CONTRIBUTIONS",
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
      // 1. Header Children (Full Width)
      const headerChildren: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: article.cadetName.toUpperCase(),
              bold: true,
              size: 36,
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
              size: 20,
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

      // 2. Body Children (Two Columns)
      const bodyChildren: any[] = [];

      // Article Profile Image
      if (article.imageUrl) {
        try {
          const base64Data = article.imageUrl.split(',')[1].replace(/\s/g, '');
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          bodyChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: bytes,
                  transformation: {
                    width: 180,
                    height: 180,
                  },
                }),
              ],
              spacing: { after: 300 },
              alignment: AlignmentType.LEFT,
            })
          );
        } catch (e) {
          console.error("Magazine Image Export Error:", e);
        }
      }

      // Content Body
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
                size: 22,
                font: "Arial",
              }),
            ],
            spacing: { after: 150 },
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }

      // Footer Note
      bodyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Filed: ${article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Official Registry'}`,
              size: 16,
              font: "Arial",
              color: "999999",
              italic: true,
            }),
          ],
          spacing: { before: 600 },
          alignment: AlignmentType.RIGHT,
        })
      );

      // Create Sections
      sections.push({
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 400,
              left: 1440,
            },
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
            margin: {
              top: 400,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: bodyChildren,
      });
    }
  }

  const doc = new Document({
    sections: sections,
  });

  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CADET_MAGAZINE_DRAFT_${new Date().toISOString().split('T')[0]}.docx`);
  } catch (error) {
    console.error("DOCX Packing Error:", error);
    throw error;
  }
}

/**
 * Generates a professional Nominal Roll / Contribution List organized by Platoon
 */
export async function exportContributionRegistry(articles: ArticleData[]) {
  // Aggregate articles by Cadet (Name cleaning + Duplicate detection)
  const cadetRegistry = new Map<string, { 
    name: string, 
    company: string, 
    platoon: string, 
    articleCount: number 
  }>();

  articles.forEach(article => {
    // Remove "OC" from the name (case-insensitive, beginning or end)
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

  const uniqueCadets = Array.from(cadetRegistry.values());

  const companies = ['Alpha', 'Bravo', 'Charlie'];
  const platoons = ['1', '2', '3'];

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

  let serialNumber = 1;

  for (const company of companies) {
    for (const platoon of platoons) {
      const platoonCadets = uniqueCadets
        .filter(c => c.company === company && c.platoon === platoon)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (platoonCadets.length === 0) continue;

      // Add Platoon Header
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

      // Create Platoon Table
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

  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: `\nRegistry Summary: ${uniqueCadets.length} Unique Contributors`, bold: true, size: 18 })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Report Generated: ${new Date().toLocaleDateString('en-GB')}`, italic: true, size: 16 })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 1000 },
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
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
