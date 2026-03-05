'use client';

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  ImageRun, 
  SectionType,
  PageBreak,
  BorderStyle,
  WidthType,
  Table,
  TableRow,
  TableCell
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
 * Each article is presented on its own page with a professional layout.
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
      const articleChildren: any[] = [];

      // Article Profile Image
      if (article.imageUrl) {
        try {
          const base64Data = article.imageUrl.split(',')[1].replace(/\s/g, '');
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          articleChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: bytes,
                  transformation: {
                    width: 150,
                    height: 150,
                  },
                }),
              ],
              spacing: { before: 400, after: 400 },
              alignment: AlignmentType.LEFT,
            })
          );
        } catch (e) {
          console.error("Magazine Image Export Error:", e);
        }
      }

      // Main Heading
      articleChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: article.cadetName.toUpperCase(),
              bold: true,
              size: 32,
              font: "Arial",
            }),
          ],
          spacing: { after: 100 },
        })
      );

      // Metadata / Subheading
      articleChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${article.company} Company | Platoon ${article.platoon}`,
              italic: true,
              size: 20,
              font: "Arial",
              color: "444444",
            }),
          ],
          spacing: { after: 600 },
        })
      );

      // Separator Line
      articleChildren.push(
        new Paragraph({
          border: {
            bottom: {
              color: "EEEEEE",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { after: 600 },
        })
      );

      // Content Body
      const contentLines = article.content.split('\n');
      for (const line of contentLines) {
        if (!line.trim()) {
          articleChildren.push(new Paragraph({ spacing: { after: 200 } }));
          continue;
        }
        
        articleChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                size: 24,
                font: "Arial",
              }),
            ],
            spacing: { after: 150 },
            alignment: AlignmentType.LEFT,
          })
        );
      }

      // Footer Note
      articleChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Filed on: ${article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Official Registry'}`,
              size: 16,
              font: "Arial",
              color: "999999",
            }),
          ],
          spacing: { before: 1000 },
          alignment: AlignmentType.RIGHT,
        })
      );

      // Add as a new section (New Page)
      sections.push({
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: articleChildren,
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
