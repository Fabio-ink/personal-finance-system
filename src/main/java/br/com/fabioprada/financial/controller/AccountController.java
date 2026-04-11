package br.com.fabioprada.financial.controller;

import br.com.fabioprada.financial.model.Account;
import br.com.fabioprada.financial.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public List<Account> listAll() {
        return accountService.findAll();
    }

    @PostMapping
    public Account create(@RequestBody Account account) {
        return accountService.save(account);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> updated(@PathVariable Long id, @RequestBody Account accountDetails) {
        return accountService.findById(id)
                .map(account -> {
                    account.setName(accountDetails.getName());
                    account.setInitialBalance(accountDetails.getInitialBalance());
                    Account updated = accountService.save(account);
                    return ResponseEntity.ok(updated);
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return accountService.findById(id)
                .map(account -> {
                    accountService.deleteById(id);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }
}