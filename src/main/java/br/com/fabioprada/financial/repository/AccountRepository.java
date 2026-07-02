package br.com.fabioprada.financial.repository;

import org.springframework.lang.NonNull;
import br.com.fabioprada.financial.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findAllByUserId(@NonNull Long userId);

    List<Account> findAllByUserIdOrderByIdAsc(@NonNull Long userId);

    Optional<Account> findByIdAndUserId(@NonNull Long id, @NonNull Long userId);

    Optional<Account> findByNameAndUserId(@NonNull String name, @NonNull Long userId);
}