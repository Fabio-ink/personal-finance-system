package br.com.fabioprada.financial.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfxTransactionDTO {
    private String name;
    private BigDecimal amount;
    private LocalDate creationDate;
    private String fitId;
}
