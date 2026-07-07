package br.com.fabioprada.financial.config;

import br.com.fabioprada.financial.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
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
