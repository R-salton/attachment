'use client';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface VisitorData {
  fullName: string;
  idNumber: string;
  age: string;
  telephone: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  profession: string;
  childBelow6: string;
  disability: string;
}

interface VisitorResponse {
  id: string;
  cadetName: string;
  platoon: string;
  visitor1: VisitorData;
  visitor2: VisitorData;
  createdAt: any;
}

const PLATOONS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

/**
 * Strategy: Group data by platoon.
 * For each platoon group:
 * 1. Add a Title Row (Merged)
 * 2. Add Header Row
 * 3. Add Cadet rows (2 rows per cadet, merged identity columns)
 */
export async function exportVisitorsToExcel(responses: VisitorResponse[], platoonLabel: string = 'ALL') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Visitor Registry');

  // Define column metadata (Widths)
  worksheet.columns = [
    { key: 'sn', width: 6 },
    { key: 'ocName', width: 25 },
    { key: 'vName', width: 25 },
    { key: 'vId', width: 18 },
    { key: 'vAge', width: 8 },
    { key: 'vTel', width: 14 },
    { key: 'dist', width: 14 },
    { key: 'sect', width: 14 },
    { key: 'cell', width: 14 },
    { key: 'vill', width: 14 },
    { key: 'vProf', width: 18 },
    { key: 'vChild', width: 22 },
    { key: 'vDis', width: 22 }
  ];

  let currentRow = 1;

  // Determine which platoons to process
  const targetPlatoons = platoonLabel === 'ALL' ? PLATOONS : [platoonLabel];

  targetPlatoons.forEach((plt) => {
    const platoonData = responses.filter(r => r.platoon === plt);
    if (platoonData.length === 0) return;

    // 1. ADD TITLE ROW
    const titleRow = worksheet.getRow(currentRow);
    titleRow.values = [`PROPOSED LIST OF CADET PARENTS TO ATTEND RNP EVENT AT PTS   ${plt}`];
    worksheet.mergeCells(currentRow, 1, currentRow, 13);
    titleRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '335C81' } }; // Deep Navy/Blue
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    // 2. ADD HEADER ROW
    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = [
      'S/N', 
      'OC NAMES', 
      'INVITED NAMES', 
      'ID', 
      'AGE', 
      'TEL', 
      'DISTRICT', 
      'SECTOR', 
      'CELLS', 
      'VILLAGES', 
      'PROFESSION', 
      'ACCOMPANIED BY CHILD BELOW 6', 
      'MENTION ANY DISABILITY'
    ];
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }; // Slate 900
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    currentRow++;

    // 3. ADD DATA ROWS
    platoonData.forEach((resp, index) => {
      const sn = index + 1;
      
      // Visitor 1 Row
      const row1 = worksheet.getRow(currentRow);
      row1.values = {
        sn: sn,
        ocName: resp.cadetName,
        vName: resp.visitor1.fullName,
        vId: resp.visitor1.idNumber,
        vAge: resp.visitor1.age,
        vTel: resp.visitor1.telephone,
        dist: resp.visitor1.district,
        sect: resp.visitor1.sector,
        cell: resp.visitor1.cell,
        vill: resp.visitor1.village,
        vProf: resp.visitor1.profession,
        vChild: resp.visitor1.childBelow6,
        vDis: resp.visitor1.disability
      };

      // Visitor 2 Row
      const row2 = worksheet.getRow(currentRow + 1);
      row2.values = {
        sn: sn,
        ocName: resp.cadetName,
        vName: resp.visitor2.fullName,
        vId: resp.visitor2.idNumber,
        vAge: resp.visitor2.age,
        vTel: resp.visitor2.telephone,
        dist: resp.visitor2.district,
        sect: resp.visitor2.sector,
        cell: resp.visitor2.cell,
        vill: resp.visitor2.village,
        vProf: resp.visitor2.profession,
        vChild: resp.visitor2.childBelow6,
        vDis: resp.visitor2.disability
      };

      // Merge SN and OC NAME cells vertically
      worksheet.mergeCells(currentRow, 1, currentRow + 1, 1); // SN
      worksheet.mergeCells(currentRow, 2, currentRow + 1, 2); // OC NAME

      // Style the newly added data rows
      [row1, row2].forEach(r => {
        r.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.font = { size: 9 };
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
        // Ensure SN and OC Name are centered specifically
        r.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      });

      currentRow += 2;
    });

    // Add a blank row between platoons for visual separation if exporting ALL
    if (platoonLabel === 'ALL') {
      currentRow++;
    }
  });

  // Export File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = platoonLabel === 'ALL' ? `FULL_CADET_VISITOR_REGISTRY_${dateStr}.xlsx` : `PLATOON_${platoonLabel}_VISITORS_${dateStr}.xlsx`;
  saveAs(blob, fileName);
}
