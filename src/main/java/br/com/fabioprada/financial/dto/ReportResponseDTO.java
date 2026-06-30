package br.com.fabioprada.financial.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponseDTO {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private List<CategoryReportDTO> categoryReports;
    private List<MonthlyTrendDTO> monthlyTrends;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryReportDTO {
        private String categoryName;
        private BigDecimal spentAmount;
        private BigDecimal plannedAmount;
        private BigDecimal averageSpentPastMonths;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrendDTO {
        private String monthName;
        private BigDecimal income;
        private BigDecimal expense;
    }
}
