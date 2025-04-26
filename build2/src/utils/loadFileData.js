import * as XLSX from 'xlsx';

const gk_isXlsx = false;
const gk_xlsxFileLookup = {};
const gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

export function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      const workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert sheet to JSON to filter blank rows
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
      // Filter out blank rows (rows where all cells are empty, null, or undefined)
      const filteredData = jsonData.filter(row => row.some(filledCell));

      // Heuristic to find the header row by ignoring rows with fewer filled cells than the next row
      let headerRowIndex = filteredData.findIndex((row, index) =>
        row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
      );
      // Fallback
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }

      // Convert filtered JSON back to CSV
      const csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex)); // Create a new sheet from filtered array of arrays
      return XLSX.utils.sheet_to_csv(csv, { header: 1 });
    } catch (e) {
      console.error(e);
      return "";
    }
  }
  return gk_fileData[filename] || "";
}