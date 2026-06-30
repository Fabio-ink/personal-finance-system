package br.com.fabioprada.financial.repository;

import br.com.fabioprada.financial.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.lang.NonNull;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

        @Query("SELECT t FROM Transaction t WHERE t.creationDate >= :startDate AND t.creationDate <= :endDate AND t.user.id = :userId")
        List<Transaction> findByDateRangeAndUserId(@Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate, @Param("userId") Long userId);

        default List<Transaction> findByYearAndMonth(int year, int month, Long userId) {
                java.time.LocalDate startDate = java.time.LocalDate.of(year, month, 1);
                java.time.LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                return findByDateRangeAndUserId(startDate, endDate, userId);
        }

        @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.category.id = :categoryId AND t.creationDate >= :startDate AND t.creationDate <= :endDate AND t.user.id = :userId AND (t.transactionType = 'EXPENSE' OR t.transactionType = 'TRANSFER')")
        BigDecimal sumAmountByCategoryIdAndDateRangeAndUserId(@Param("categoryId") Long categoryId,
                        @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate, @Param("userId") Long userId);

        default BigDecimal sumAmountByCategoryIdAndYearAndMonthAndUserId(Long categoryId, int year, int month, Long userId) {
                java.time.LocalDate startDate = java.time.LocalDate.of(year, month, 1);
                java.time.LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                return sumAmountByCategoryIdAndDateRangeAndUserId(categoryId, startDate, endDate, userId);
        }

        List<Transaction> findAllByUserId(@NonNull Long userId);

        Optional<Transaction> findByIdAndUserId(@NonNull Long id, @NonNull Long userId);

        void deleteByIdAndUserId(@NonNull Long id, @NonNull Long userId);

        boolean existsByNameAndAmountAndCreationDateAndUserId(String name, BigDecimal amount, java.time.LocalDate creationDate, Long userId);

        @org.springframework.data.jpa.repository.Modifying
        @Query("UPDATE Transaction t SET t.category = null WHERE t.category.id = :categoryId AND t.user.id = :userId")
        void deselectCategory(@Param("categoryId") Long categoryId, @Param("userId") Long userId);
}