package br.com.fabioprada.financial.repository;

import org.springframework.lang.NonNull;
import br.com.fabioprada.financial.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findAllByUserId(@NonNull Long userId);

    List<Account> findAllByUserIdOrderByIdAsc(@NonNull Long userId);

    Optional<Account> findByIdAndUserId(@NonNull Long id, @NonNull Long userId);

    Optional<Account> findByNameAndUserId(@NonNull String name, @NonNull Long userId);

    Optional<Account> findByNameIgnoreCaseAndUserId(@NonNull String name, @NonNull Long userId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE accounts a SET current_balance = initial_balance " +
            "+ (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.in_account_id = a.id) " +
            "- (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.out_account_id = a.id)", nativeQuery = true)
    void recalculateAllBalances();
}