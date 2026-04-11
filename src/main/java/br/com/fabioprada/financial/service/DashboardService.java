package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.dto.MonthSummaryDTO;
import br.com.fabioprada.financial.model.MonthlyPlanning;
import br.com.fabioprada.financial.model.Transaction;
import br.com.fabioprada.financial.model.TransactionType;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.MonthlyPlanningRepository;
import br.com.fabioprada.financial.repository.TransactionRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final MonthlyPlanningRepository monthlyPlanningRepository;

    public DashboardService(TransactionRepository transactionRepository,
            MonthlyPlanningRepository monthlyPlanningRepository) {
        this.transactionRepository = transactionRepository;
        this.monthlyPlanningRepository = monthlyPlanningRepository;
    }

    public Map<String, MonthSummaryDTO> getMonthlySummaries() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            User user = (User) principal;
            Long userId = user.getId();
            if (userId != null) {
                LocalDate today = LocalDate.now();
                YearMonth currentMonth = YearMonth.from(today);
                YearMonth previousMonth2 = currentMonth.minusMonths(2);
                YearMonth previousMonth = currentMonth.minusMonths(1);
                YearMonth nextMonth = currentMonth.plusMonths(1);

                MonthSummaryDTO previousMonth2Summary = createSummaryForMonth(previousMonth2,
                        Objects.requireNonNull(userId));
                MonthSummaryDTO previousMonthSummary = createSummaryForMonth(previousMonth,
                        Objects.requireNonNull(userId));
                MonthSummaryDTO currentMonthSummary = createSummaryForMonth(currentMonth,
                        Objects.requireNonNull(userId));
                MonthSummaryDTO nextMonthSummary = createSummaryForMonth(nextMonth, Objects.requireNonNull(userId));

                return Map.of(
                        "previous2", previousMonth2Summary,
                        "previous", previousMonthSummary,
                        "current", currentMonthSummary,
                        "next", nextMonthSummary);
            }
        }
        return Collections.emptyMap();
    }

    public List<Transaction> getAllTransactions() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            User user = (User) principal;
            Long userId = user.getId();
            if (userId != null) {
                return transactionRepository.findAllByUserId(Objects.requireNonNull(userId));
            }
        }
        return Collections.emptyList();
    }

    private MonthSummaryDTO createSummaryForMonth(YearMonth month, Long userId) {
        List<Transaction> transactions = transactionRepository.findByYearAndMonth(month.getYear(),
                month.getMonthValue(), userId);
        List<MonthlyPlanning> plannings = monthlyPlanningRepository.findByYearAndMonthAndUserId(month.getYear(),
                month.getMonthValue(), userId);

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSpent = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal plannedBudget = plannings.stream()
                .map(MonthlyPlanning::getPlannedValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String title = month.format(DateTimeFormatter.ofPattern("yyyy-MMMM"));

        return new MonthSummaryDTO(title, totalSpent, totalIncome, plannedBudget);
    }
}