package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.model.Account;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.AccountRepository;
import br.com.fabioprada.financial.security.UserContextService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserContextService userContextService;

    public AccountService(AccountRepository accountRepository, UserContextService userContextService) {
        this.accountRepository = accountRepository;
        this.userContextService = userContextService;
    }

    public List<Account> findAll() {
        return userContextService.getCurrentUser()
                .map(user -> accountRepository.findAllByUserIdOrderByIdAsc(user.getId()))
                .orElse(Collections.emptyList());
    }

    public Optional<Account> findById(Long id) {
        return userContextService.getCurrentUser()
                .flatMap(user -> accountRepository.findByIdAndUserId(id, user.getId()));
    }

    public Account save(Account account) {
        User user = userContextService.getCurrentUserOrThrow();
        account.setUser(user);

        if (account.getId() == null) {
            account.setCurrentBalance(account.getInitialBalance());
        }

        Account savedAccount = accountRepository.save(account);

        if (Boolean.TRUE.equals(savedAccount.getIsMain())) {
            List<Account> userAccounts = accountRepository.findAllByUserId(user.getId());
            for (Account acc : userAccounts) {
                if (!acc.getId().equals(savedAccount.getId()) && Boolean.TRUE.equals(acc.getIsMain())) {
                    acc.setIsMain(false);
                    accountRepository.save(acc);
                }
            }
        }

        return savedAccount;
    }

    public Account update(Long id, Account accountDetails) {
        User user = userContextService.getCurrentUserOrThrow();
        Account existingAccount = accountRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + id));

        BigDecimal oldInitialBalance = existingAccount.getInitialBalance();
        BigDecimal newInitialBalance = accountDetails.getInitialBalance();

        existingAccount.setName(accountDetails.getName());
        existingAccount.setInitialBalance(newInitialBalance);
        existingAccount.setIsMain(Boolean.TRUE.equals(accountDetails.getIsMain()));

        if (oldInitialBalance.compareTo(newInitialBalance) != 0) {
            BigDecimal difference = newInitialBalance.subtract(oldInitialBalance);
            existingAccount.setCurrentBalance(existingAccount.getCurrentBalance().add(difference));
        }

        Account savedAccount = accountRepository.save(existingAccount);

        if (Boolean.TRUE.equals(savedAccount.getIsMain())) {
            List<Account> userAccounts = accountRepository.findAllByUserId(user.getId());
            for (Account acc : userAccounts) {
                if (!acc.getId().equals(savedAccount.getId()) && Boolean.TRUE.equals(acc.getIsMain())) {
                    acc.setIsMain(false);
                    accountRepository.save(acc);
                }
            }
        }

        return savedAccount;
    }

    public void deleteById(Long id) {
        userContextService.getCurrentUser().ifPresent(user -> accountRepository.findByIdAndUserId(id, user.getId())
                .ifPresent(accountRepository::delete));
    }
}