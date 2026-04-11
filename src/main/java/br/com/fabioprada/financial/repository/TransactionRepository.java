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

        @Query("SELECT t FROM Transaction t WHERE YEAR(t.creationDate) = :year AND MONTH(t.creationDate) = :month AND t.user.id = :userId")
        List<Transaction> findByYearAndMonth(@Param("year") int year, @Param("month") int month,
                        @Param("userId") @NonNull Long userId);

        @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.category.id = :categoryId AND YEAR(t.creationDate) = :year AND MONTH(t.creationDate) = :month AND t.user.id = :userId AND (t.transactionType = 'EXPENSE' OR t.transactionType = 'TRANSFER')")
        BigDecimal sumAmountByCategoryIdAndYearAndMonthAndUserId(@Param("categoryId") Long categoryId,
                        @Param("year") int year, @Param("month") int month, @Param("userId") Long userId);

        List<Transaction> findAllByUserId(@NonNull Long userId);

        Optional<Transaction> findByIdAndUserId(@NonNull Long id, @NonNull Long userId);

        void deleteByIdAndUserId(@NonNull Long id, @NonNull Long userId);
}