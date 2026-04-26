
'use client';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface VisitorData {
  fullName: string;
  idNumber: string;
  age: string;
  telephone: string;
  location: string;
  profession: string;
  childBelow6: string;
  childAge?: string;
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

/**
 * Strategy: Each cadet record generates TWO rows.
 * Identity info (SN, Cadet Name, Platoon) is merged across the two rows.
 */
export async function exportVisitorsToExcel(responses: VisitorResponse[], platoonLabel: string = 'ALL') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Visitor List');

  // Define Columns
  worksheet.columns = [
    { header: 'S/N', key: 'sn', width: 8 },
    { header: 'CADET NAME', key: 'cadetName', width: 30 },
    { header: 'PLATOON', key: 'platoon', width: 12 },
    { header: 'VISITOR NAME', key: 'vName', width: 25 },
    { header: 'ID NUMBER', key: 'vId', width: 20 },
    { header: 'AGE', key: 'vAge', width: 10 },
    { header: 'TELEPHONE', key: 'vTel', width: 15 },
    { header: 'LOCATION (D/S/C/V)', key: 'vLoc', width: 35 },
    { header: 'PROFESSION', key: 'vProf', width: 20 },
    { header: 'CHILD < 6 (AGE)', key: 'vChild', width: 15 },
    { header: 'DISABILITY', key: 'vDis', width: 15 }
  ];

  // Header Styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let currentRow = 2;
  responses.forEach((resp, index) => {
    const sn = index + 1;
    
    // Row 1: Visitor 1
    const row1Values = {
      sn: sn,
      cadetName: resp.cadetName,
      platoon: resp.platoon,
      vName: resp.visitor1.fullName,
      vId: resp.visitor1.idNumber,
      vAge: resp.visitor1.age,
      vTel: resp.visitor1.telephone,
      vLoc: resp.visitor1.location,
      vProf: resp.visitor1.profession,
      vChild: `${resp.visitor1.childBelow6}${resp.visitor1.childAge ? ` (${resp.visitor1.childAge})` : ''}`,
      vDis: resp.visitor1.disability
    };
    worksheet.addRow(row1Values);

    // Row 2: Visitor 2
    const row2Values = {
      sn: sn,
      cadetName: resp.cadetName,
      platoon: resp.platoon,
      vName: resp.visitor2.fullName,
      vId: resp.visitor2.idNumber,
      vAge: resp.visitor2.age,
      vTel: resp.visitor2.telephone,
      vLoc: resp.visitor2.location,
      vProf: resp.visitor2.profession,
      vChild: `${resp.visitor2.childBelow6}${resp.visitor2.childAge ? ` (${resp.visitor2.childAge})` : ''}`,
      vDis: resp.visitor2.disability
    };
    worksheet.addRow(row2Values);

    // MERGE Identity Columns (SN, Name, Platoon)
    worksheet.mergeCells(currentRow, 1, currentRow + 1, 1); // SN
    worksheet.mergeCells(currentRow, 2, currentRow + 1, 2); // Name
    worksheet.mergeCells(currentRow, 3, currentRow + 1, 3); // Platoon

    currentRow += 2;
  });

  // Apply Borders & Alignment to all data cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (rowNumber > 1) {
        cell.alignment = { vertical: 'middle', horizontal: rowNumber % 2 === 0 ? 'left' : 'left', wrapText: true };
      }
    });
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(blob, `VISITORS_${platoonLabel}_${dateStr}.xlsx`);
}
