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
 * Each article is presented with a professional two-column layout.
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

      // Article Profile Image (placed at start of content)
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

      // Create Sections for this article
      // Header Section (1 column, starts on new page)
      sections.push({
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 400, // Reduced bottom to allow continuous flow
              left: 1440,
            },
          },
        },
        children: headerChildren,
      });

      // Body Section (2 columns, continues on same page)
      sections.push({
        properties: {
          type: SectionType.CONTINUOUS,
          column: {
            count: 2,
            space: 720, // 0.5 inch gap between columns
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
