package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.dto.ReportResponseDTO;
import br.com.fabioprada.financial.model.Category;
import br.com.fabioprada.financial.model.MonthlyPlanning;
import br.com.fabioprada.financial.model.Transaction;
import br.com.fabioprada.financial.model.TransactionType;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.CategoryRepository;
import br.com.fabioprada.financial.repository.MonthlyPlanningRepository;
import br.com.fabioprada.financial.repository.TransactionRepository;
import br.com.fabioprada.financial.security.UserContextService;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final MonthlyPlanningRepository monthlyPlanningRepository;
    private final CategoryRepository categoryRepository;
    private final UserContextService userContextService;

    public ReportService(TransactionRepository transactionRepository,
                         MonthlyPlanningRepository monthlyPlanningRepository,
                         CategoryRepository categoryRepository,
                         UserContextService userContextService) {
        this.transactionRepository = transactionRepository;
        this.monthlyPlanningRepository = monthlyPlanningRepository;
        this.categoryRepository = categoryRepository;
        this.userContextService = userContextService;
    }

    public ReportResponseDTO generateReport(int month, int year) {
        User user = userContextService.getCurrentUserOrThrow();
        Long userId = user.getId();

        List<Transaction> currentMonthTx = transactionRepository.findByYearAndMonth(year, month, userId);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        Map<Long, BigDecimal> categoryExpenses = new HashMap<>();

        for (Transaction t : currentMonthTx) {
            BigDecimal amt = t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO;
            if (t.getTransactionType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(amt);
            } else if (t.getTransactionType() == TransactionType.EXPENSE || t.getTransactionType() == TransactionType.CREDIT_CARD) {
                totalExpense = totalExpense.add(amt);
                if (t.getCategory() != null) {
                    Long catId = t.getCategory().getId();
                    categoryExpenses.put(catId, categoryExpenses.getOrDefault(catId, BigDecimal.ZERO).add(amt));
                }
            }
        }

        List<MonthlyPlanning> plannings = monthlyPlanningRepository.findByYearAndMonthAndUserId(year, month, userId);
        Map<Long, BigDecimal> categoryPlans = new HashMap<>();
        for (MonthlyPlanning mp : plannings) {
            if (mp.getCategory() != null) {
                categoryPlans.put(mp.getCategory().getId(), mp.getPlannedValue() != null ? mp.getPlannedValue() : BigDecimal.ZERO);
            }
        }

        List<Category> allCategories = categoryRepository.findAllByUserId(userId);
        List<ReportResponseDTO.CategoryReportDTO> categoryReports = new ArrayList<>();

        for (Category cat : allCategories) {
            BigDecimal spent = categoryExpenses.getOrDefault(cat.getId(), BigDecimal.ZERO);
            BigDecimal planned = categoryPlans.getOrDefault(cat.getId(), BigDecimal.ZERO);

            if (spent.compareTo(BigDecimal.ZERO) == 0 && planned.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            BigDecimal sumPast = BigDecimal.ZERO;
            int countPast = 0;
            LocalDate currentRef = LocalDate.of(year, month, 1);

            for (int i = 1; i <= 3; i++) {
                LocalDate pastRef = currentRef.minusMonths(i);
                List<Transaction> pastTx = transactionRepository.findByYearAndMonth(pastRef.getYear(), pastRef.getMonthValue(), userId);
                BigDecimal spentPastMonth = BigDecimal.ZERO;
                for (Transaction t : pastTx) {
                    if (t.getCategory() != null && t.getCategory().getId().equals(cat.getId()) &&
                        (t.getTransactionType() == TransactionType.EXPENSE || t.getTransactionType() == TransactionType.CREDIT_CARD)) {
                        spentPastMonth = spentPastMonth.add(t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO);
                    }
                }
                if (spentPastMonth.compareTo(BigDecimal.ZERO) > 0) {
                    sumPast = sumPast.add(spentPastMonth);
                }
                countPast++;
            }

            BigDecimal avg = countPast > 0 ? sumPast.divide(BigDecimal.valueOf(countPast), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            categoryReports.add(new ReportResponseDTO.CategoryReportDTO(
                cat.getName(),
                spent,
                planned,
                avg
            ));
        }

        List<ReportResponseDTO.MonthlyTrendDTO> monthlyTrends = new ArrayList<>();
        LocalDate baseDate = LocalDate.of(year, month, 1);

        for (int i = 5; i >= 0; i--) {
            LocalDate targetDate = baseDate.minusMonths(i);
            int y = targetDate.getYear();
            int m = targetDate.getMonthValue();

            List<Transaction> mTx = transactionRepository.findByYearAndMonth(y, m, userId);
            BigDecimal inc = BigDecimal.ZERO;
            BigDecimal exp = BigDecimal.ZERO;

            for (Transaction t : mTx) {
                BigDecimal amt = t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO;
                if (t.getTransactionType() == TransactionType.INCOME) {
                    inc = inc.add(amt);
                } else if (t.getTransactionType() == TransactionType.EXPENSE || t.getTransactionType() == TransactionType.CREDIT_CARD) {
                    exp = exp.add(amt);
                }
            }

            String monthName = "%02d/%d".formatted(m, y);
            monthlyTrends.add(new ReportResponseDTO.MonthlyTrendDTO(monthName, inc, exp));
        }

        return new ReportResponseDTO(totalIncome, totalExpense, categoryReports, monthlyTrends);
    }
}
