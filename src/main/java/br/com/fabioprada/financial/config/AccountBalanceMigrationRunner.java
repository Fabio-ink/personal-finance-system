package br.com.fabioprada.financial.config;

import br.com.fabioprada.financial.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.migration.recalculate-balances", havingValue = "true", matchIfMissing = false)
public class AccountBalanceMigrationRunner implements CommandLineRunner {

    private final AccountRepository accountRepository;

    public AccountBalanceMigrationRunner(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        accountRepository.recalculateAllBalances();
    }
}
