package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.dto.OfxTransactionDTO;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class OfxParserService {

    public List<OfxTransactionDTO> parseOfx(InputStream inputStream) {
        List<OfxTransactionDTO> transactions = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            LocalDate date = null;
            BigDecimal amount = null;
            String memo = null;
            String fitId = null;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.startsWith("<STMTTRN>")) {
                    date = null;
                    amount = null;
                    memo = null;
                    fitId = null;
                } else if (line.startsWith("<DTPOSTED>")) {
                    date = parseOfxDate(extractValue(line));
                } else if (line.startsWith("<TRNAMT>")) {
                    String val = extractValue(line);
                    if (val != null) {
                        amount = new BigDecimal(val.replace(",", "."));
                    }
                } else if (line.startsWith("<MEMO>")) {
                    memo = extractValue(line);
                } else if (line.startsWith("<FITID>")) {
                    fitId = extractValue(line);
                } else if (line.startsWith("</STMTTRN>")) {
                    if (date != null && amount != null) {
                        transactions.add(new OfxTransactionDTO(memo != null ? memo : "OFX Transaction", amount, date, fitId));
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return transactions;
    }

    private String extractValue(String line) {
        int closeTagIndex = line.indexOf(">");
        if (closeTagIndex == -1) {
            return null;
        }
        String content = line.substring(closeTagIndex + 1);
        int openTagIndex = content.indexOf("<");
        if (openTagIndex != -1) {
            content = content.substring(0, openTagIndex);
        }
        return content.trim();
    }

    private LocalDate parseOfxDate(String dateStr) {
        if (dateStr == null || dateStr.length() < 8) {
            return null;
        }
        String cleanDate = dateStr.substring(0, 8);
        return LocalDate.parse(cleanDate, DateTimeFormatter.ofPattern("yyyyMMdd"));
    }
}
