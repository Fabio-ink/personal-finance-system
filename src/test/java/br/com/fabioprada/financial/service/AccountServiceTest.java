package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.model.Account;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.AccountRepository;
import br.com.fabioprada.financial.security.UserContextService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Optional;

public class AccountServiceTest {

    private AccountRepository accountRepository;
    private UserContextService userContextService;
    private AccountService accountService;

    @BeforeEach
    public void setUp() {
        accountRepository = Mockito.mock(AccountRepository.class);
        userContextService = Mockito.mock(UserContextService.class);
        accountService = new AccountService(accountRepository, userContextService);
    }

    @Test
    public void testUpdateAccountBalanceIncrease() {
        User user = new User();
        user.setId(1L);

        Account existingAccount = new Account();
        existingAccount.setId(1L);
        existingAccount.setName("XP");
        existingAccount.setInitialBalance(new BigDecimal("1000.00"));
        existingAccount.setCurrentBalance(new BigDecimal("1200.00"));
        existingAccount.setIsMain(false);

        Account updateDetails = new Account();
        updateDetails.setName("XP");
        updateDetails.setInitialBalance(new BigDecimal("1500.00"));
        updateDetails.setIsMain(false);

        Mockito.when(userContextService.getCurrentUserOrThrow()).thenReturn(user);
        Mockito.when(accountRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existingAccount));
        Mockito.when(accountRepository.save(Mockito.any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account result = accountService.update(1L, updateDetails);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(new BigDecimal("1500.00"), result.getInitialBalance());
        Assertions.assertEquals(new BigDecimal("1700.00"), result.getCurrentBalance());
    }

    @Test
    public void testUpdateAccountBalanceDecrease() {
        User user = new User();
        user.setId(1L);

        Account existingAccount = new Account();
        existingAccount.setId(1L);
        existingAccount.setName("XP");
        existingAccount.setInitialBalance(new BigDecimal("1000.00"));
        existingAccount.setCurrentBalance(new BigDecimal("1200.00"));
        existingAccount.setIsMain(false);

        Account updateDetails = new Account();
        updateDetails.setName("XP");
        updateDetails.setInitialBalance(new BigDecimal("800.00"));
        updateDetails.setIsMain(false);

        Mockito.when(userContextService.getCurrentUserOrThrow()).thenReturn(user);
        Mockito.when(accountRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existingAccount));
        Mockito.when(accountRepository.save(Mockito.any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account result = accountService.update(1L, updateDetails);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(new BigDecimal("800.00"), result.getInitialBalance());
        Assertions.assertEquals(new BigDecimal("1000.00"), result.getCurrentBalance());
    }
}
