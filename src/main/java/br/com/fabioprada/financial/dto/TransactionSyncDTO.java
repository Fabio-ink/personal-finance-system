package br.com.fabioprada.financial.dto;

import br.com.fabioprada.financial.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionSyncDTO {
    private String name;
    private BigDecimal amount;
    private LocalDate creationDate;
    private TransactionType transactionType;
    private String categoryName;
    private String inAccountName;
    private String outAccountName;
    private Integer installmentNumber;
    private Integer totalInstallments;
}
