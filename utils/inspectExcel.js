import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE_PATH = path.resolve(__dirname, '..', 'output', 'customers.xlsx');

const inspect = async () => {
    try {
        if (!fs.existsSync(EXCEL_FILE_PATH)) {
            console.log('File not found at:', EXCEL_FILE_PATH);
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
        const worksheet = workbook.getWorksheet(1);

        console.log('--- Inspecting Excel ---');
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const c1 = row.getCell(1).value;
                const c2 = row.getCell(2).value;
                const c3 = row.getCell(3).value;

                console.log(`Row ${rowNumber}:`);
                console.log(`  Col 1:`, JSON.stringify(c1));
                console.log(`  Col 2:`, JSON.stringify(c2));
                console.log(`  Col 3:`, JSON.stringify(c3));
            }
        });
        console.log('--- End Inspection ---');
    } catch (err) {
        console.error(err);
    }
};

inspect();
