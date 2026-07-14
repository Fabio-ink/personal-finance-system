package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.model.Account;
import br.com.fabioprada.financial.model.Category;
import br.com.fabioprada.financial.model.Transaction;
import br.com.fabioprada.financial.model.TransactionType;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
public class ExcelService {

    public static String TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // Transactions Constants
    static String[] TRANSACTION_HEADERS = { "Name", "Date", "Amount", "Type", "Category", "Out Account",
            "In Account" };
    static String TRANSACTIONS_SHEET = "Transactions";

    // Planning Constants
    static String[] PLANNING_HEADERS = { "Month", "Year", "Category", "Estimated Amount" };
    static String PLANNING_SHEET = "Planning";

    public ByteArrayInputStream exportToExcel(List<Transaction> transactions,
            List<br.com.fabioprada.financial.model.MonthlyPlanning> plannings) {

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // --- Transactions Sheet ---
            Sheet transSheet = workbook.createSheet(TRANSACTIONS_SHEET);
            Row transHeaderRow = transSheet.createRow(0);
            for (int col = 0; col < TRANSACTION_HEADERS.length; col++) {
                Cell cell = transHeaderRow.createCell(col);
                cell.setCellValue(TRANSACTION_HEADERS[col]);
            }

            int transRowIdx = 1;
            for (Transaction transaction : transactions) {
                Row row = transSheet.createRow(transRowIdx++);
                row.createCell(0).setCellValue(transaction.getName() != null ? transaction.getName() : "");
                row.createCell(1).setCellValue(transaction.getCreationDate() != null ? transaction.getCreationDate().toString() : "");
                row.createCell(2).setCellValue(transaction.getAmount() != null ? transaction.getAmount().doubleValue() : 0.0);
                row.createCell(3).setCellValue(transaction.getTransactionType() != null ? transaction.getTransactionType().name() : "");

                if (transaction.getCategory() != null) {
                    row.createCell(4).setCellValue(transaction.getCategory().getName() != null ? transaction.getCategory().getName() : "");
                }

                if (transaction.getOutAccount() != null) {
                    row.createCell(5).setCellValue(transaction.getOutAccount().getName() != null ? transaction.getOutAccount().getName() : "");
                }

                if (transaction.getInAccount() != null) {
                    row.createCell(6).setCellValue(transaction.getInAccount().getName() != null ? transaction.getInAccount().getName() : "");
                }
            }

            // --- Planning Sheet ---
            if (plannings != null) {
                Sheet planSheet = workbook.createSheet(PLANNING_SHEET);
                Row planHeaderRow = planSheet.createRow(0);
                for (int col = 0; col < PLANNING_HEADERS.length; col++) {
                    Cell cell = planHeaderRow.createCell(col);
                    cell.setCellValue(PLANNING_HEADERS[col]);
                }

                int planRowIdx = 1;
                for (br.com.fabioprada.financial.model.MonthlyPlanning plan : plannings) {
                    Row row = planSheet.createRow(planRowIdx++);
                    row.createCell(0).setCellValue(plan.getMonth());
                    row.createCell(1).setCellValue(plan.getYear());
                    if (plan.getCategory() != null) {
                        row.createCell(2).setCellValue(plan.getCategory().getName() != null ? plan.getCategory().getName() : "");
                    }
                    row.createCell(3).setCellValue(plan.getEstimatedAmount() != null ? plan.getEstimatedAmount().doubleValue() : 0.0);
                }
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("fail to import data to Excel file: " + e.getMessage());
        }
    }

    public br.com.fabioprada.financial.dto.ImportDataDTO importData(InputStream is) {
        br.com.fabioprada.financial.dto.ImportDataDTO data = new br.com.fabioprada.financial.dto.ImportDataDTO();
        List<Transaction> transactions = new ArrayList<>();
        List<br.com.fabioprada.financial.model.MonthlyPlanning> plannings = new ArrayList<>();

        try {
            Workbook workbook = new XSSFWorkbook(is);

            // --- Import Transactions ---
            Sheet transSheet = null;
            // First try finding by name
            Sheet sheetByName = workbook.getSheet(TRANSACTIONS_SHEET);
            if (sheetByName != null && isTransactionSheet(sheetByName)) {
                transSheet = sheetByName;
            } else {
                // Iterate through sheets to find one that matches structure
                for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                    Sheet s = workbook.getSheetAt(i);
                    if (isTransactionSheet(s)) {
                        transSheet = s;
                        break;
                    }
                }
            }

            if (transSheet != null) {
                System.out.println("Processing transactions from sheet: " + transSheet.getSheetName());
                transactions = parseTransactions(transSheet);
                System.out.println("Parsed " + transactions.size() + " transactions.");
            } else {
                System.out.println("No valid Transactions sheet found.");
            }

            // --- Import Planning ---
            Sheet planSheet = null;
            // First try finding by name
            sheetByName = workbook.getSheet(PLANNING_SHEET);
            if (sheetByName != null && isPlanningSheet(sheetByName)) {
                planSheet = sheetByName;
            } else {
                // Iterate through sheets to find one that matches structure
                for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                    Sheet s = workbook.getSheetAt(i);
                    // Avoid re-processing the same sheet if it was already identified as
                    // transactions
                    // strictly speaking we could have a sheet that satisfies both if headers
                    // overlap, but unlikely here.
                    if (s == transSheet)
                        continue;

                    if (isPlanningSheet(s)) {
                        planSheet = s;
                        break;
                    }
                }
            }

            if (planSheet != null) {
                System.out.println("Processing planning from sheet: " + planSheet.getSheetName());
                plannings = parsePlanning(planSheet);
                System.out.println("Parsed " + plannings.size() + " planning items.");
            } else {
                System.out.println("No valid Planning sheet found.");
            }

            workbook.close();

            data.setTransactions(transactions);
            data.setMonthlyPlannings(plannings);
            return data;
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("fail to parse Excel file: " + e.getMessage());
        }
    }

    private boolean isTransactionSheet(Sheet sheet) {
        if (sheet == null)
            return false;
        Row header = sheet.getRow(0);
        if (header == null)
            return false;

        // Check for key columns for Transactions: "Nome", "Data", "Valor", "Tipo"
        // We look for at least a subset of critical columns to be considered a
        // transaction sheet
        boolean hasName = false;
        boolean hasDate = false;
        boolean hasAmount = false;

        for (Cell cell : header) {
            String val = getCellValueAsString(cell).trim();
            if ("Name".equalsIgnoreCase(val) || "Nome".equalsIgnoreCase(val))
                hasName = true;
            if ("Date".equalsIgnoreCase(val) || "Data".equalsIgnoreCase(val))
                hasDate = true;
            if ("Amount".equalsIgnoreCase(val) || "Valor".equalsIgnoreCase(val))
                hasAmount = true;
        }

        return hasName && hasDate && hasAmount;
    }

    private boolean isPlanningSheet(Sheet sheet) {
        if (sheet == null)
            return false;
        Row header = sheet.getRow(0);
        if (header == null)
            return false;

        // Check for key columns for Planning: "Mês", "Ano", "Categoria", "Valor
        // Estimado"
        boolean hasMonth = false;
        boolean hasYear = false;
        boolean hasCategory = false;
        boolean hasEstimated = false; // "Valor Estimado"

        for (Cell cell : header) {
            String val = getCellValueAsString(cell).trim();
            if ("Month".equalsIgnoreCase(val) || "Mês".equalsIgnoreCase(val) || "Mes".equalsIgnoreCase(val))
                hasMonth = true;
            if ("Year".equalsIgnoreCase(val) || "Ano".equalsIgnoreCase(val))
                hasYear = true;
            if ("Category".equalsIgnoreCase(val) || "Categoria".equalsIgnoreCase(val))
                hasCategory = true;
            if ("Estimated Amount".equalsIgnoreCase(val) || "Valor Estimado".equalsIgnoreCase(val))
                hasEstimated = true;
        }

        return hasMonth && hasYear && hasCategory && hasEstimated;
    }

    private List<Transaction> parseTransactions(Sheet sheet) {
        List<Transaction> transactions = new ArrayList<>();
        Iterator<Row> rows = sheet.iterator();
        int rowNumber = 0;
        while (rows.hasNext()) {
            Row currentRow = rows.next();
            if (rowNumber == 0) {
                rowNumber++;
                continue;
            } // Skip header

            // Skip empty rows
            if (currentRow.getCell(0) == null && currentRow.getCell(2) == null)
                continue;

            Transaction transaction = new Transaction();

            Cell nameCell = currentRow.getCell(0);
            if (nameCell != null)
                transaction.setName(getCellValueAsString(nameCell));

            Cell dateCell = currentRow.getCell(1);
            if (dateCell != null) {
                String dateStr = getCellValueAsString(dateCell);
                try {
                    if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                        transaction.setCreationDate(dateCell.getLocalDateTimeCellValue().toLocalDate());
                    } else {
                        transaction.setCreationDate(LocalDate.parse(dateStr));
                    }
                } catch (Exception e) {
                    // ignore date error or log
                }
            }

            Cell amountCell = currentRow.getCell(2);
            if (amountCell != null) {
                if (amountCell.getCellType() == CellType.NUMERIC) {
                    transaction.setAmount(BigDecimal.valueOf(amountCell.getNumericCellValue()));
                } else {
                    try {
                        transaction.setAmount(new BigDecimal(getCellValueAsString(amountCell)));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
            }

            Cell typeCell = currentRow.getCell(3);
            if (typeCell != null) {
                try {
                    transaction.setTransactionType(TransactionType.valueOf(getCellValueAsString(typeCell)));
                } catch (IllegalArgumentException e) {
                    // ignore
                }
            }

            Cell categoryCell = currentRow.getCell(4);
            if (categoryCell != null) {
                String catName = getCellValueAsString(categoryCell);
                if (!catName.isEmpty()) {
                    Category c = new Category();
                    c.setName(catName);
                    transaction.setCategory(c);
                }
            }

            Cell outCell = currentRow.getCell(5);
            if (outCell != null) {
                String outName = getCellValueAsString(outCell);
                if (!outName.isEmpty()) {
                    Account a = new Account();
                    a.setName(outName);
                    transaction.setOutAccount(a);
                }
            }

            Cell inCell = currentRow.getCell(6);
            if (inCell != null) {
                String inName = getCellValueAsString(inCell);
                if (!inName.isEmpty()) {
                    Account a = new Account();
                    a.setName(inName);
                    transaction.setInAccount(a);
                }
            }

            // Basic validation to add only fully formed transactions if needed
            if (transaction.getName() != null && transaction.getAmount() != null) {
                transactions.add(transaction);
            }
        }
        return transactions;
    }

    private List<br.com.fabioprada.financial.model.MonthlyPlanning> parsePlanning(Sheet sheet) {
        List<br.com.fabioprada.financial.model.MonthlyPlanning> plannings = new ArrayList<>();
        Iterator<Row> rows = sheet.iterator();
        int rowNumber = 0;
        while (rows.hasNext()) {
            Row currentRow = rows.next();
            if (rowNumber == 0) {
                rowNumber++;
                continue;
            }

            // Skip empty rows
            if (currentRow.getCell(2) == null && currentRow.getCell(3) == null)
                continue;

            br.com.fabioprada.financial.model.MonthlyPlanning mp = new br.com.fabioprada.financial.model.MonthlyPlanning();

            // Month
            Cell monthCell = currentRow.getCell(0);
            if (monthCell != null) {
                try {
                    mp.setMonth((int) Double.parseDouble(getCellValueAsString(monthCell)));
                } catch (NumberFormatException e) {
                }
            }

            // Year
            Cell yearCell = currentRow.getCell(1);
            if (yearCell != null) {
                try {
                    mp.setYear((int) Double.parseDouble(getCellValueAsString(yearCell)));
                } catch (NumberFormatException e) {
                }
            }

            // Category
            Cell catCell = currentRow.getCell(2);
            if (catCell != null) {
                String catName = getCellValueAsString(catCell);
                if (!catName.isEmpty()) {
                    Category c = new Category();
                    c.setName(catName);
                    mp.setCategory(c);
                }
            }

            // Estimated Amount
            Cell amountCell = currentRow.getCell(3);
            if (amountCell != null) {
                if (amountCell.getCellType() == CellType.NUMERIC) {
                    mp.setEstimatedAmount(BigDecimal.valueOf(amountCell.getNumericCellValue()));
                } else {
                    try {
                        mp.setEstimatedAmount(new BigDecimal(getCellValueAsString(amountCell)));
                    } catch (NumberFormatException e) {
                    }
                }
            }

            if (mp.getMonth() > 0 && mp.getYear() > 0 && mp.getEstimatedAmount() != null) {
                plannings.add(mp);
            }
        }
        return plannings;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }
}
