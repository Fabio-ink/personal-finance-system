package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.model.Transaction;
import br.com.fabioprada.financial.model.TransactionType;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.TransactionRepository;
import br.com.fabioprada.financial.security.UserContextService;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.multipart.MultipartFile;
import br.com.fabioprada.financial.repository.CategoryRepository;
import br.com.fabioprada.financial.repository.AccountRepository;
import br.com.fabioprada.financial.model.Category;
import br.com.fabioprada.financial.model.Account;
import java.io.ByteArrayInputStream;
import java.io.IOException;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserContextService userContextService;
    private final ExcelService excelService;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final br.com.fabioprada.financial.repository.MonthlyPlanningRepository monthlyPlanningRepository;
    private final TransactionCategorizationService transactionCategorizationService;

    public TransactionService(TransactionRepository transactionRepository, UserContextService userContextService,
            ExcelService excelService,
            CategoryRepository categoryRepository, AccountRepository accountRepository,
            br.com.fabioprada.financial.repository.MonthlyPlanningRepository monthlyPlanningRepository,
            TransactionCategorizationService transactionCategorizationService) {
        this.transactionRepository = transactionRepository;
        this.userContextService = userContextService;
        this.excelService = excelService;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.monthlyPlanningRepository = monthlyPlanningRepository;
        this.transactionCategorizationService = transactionCategorizationService;
    }

    public Page<Transaction> searchTransactions(String name, LocalDate startDate, LocalDate endDate, Long categoryId,
            String transactionType, Pageable pageable) {
        return userContextService.getCurrentUser().map(user -> {
            Specification<Transaction> spec = createSpecification(user.getId(), name, startDate, endDate, categoryId,
                    transactionType);
            return transactionRepository.findAll(spec, pageable);
        }).orElse(Page.empty());
    }

    private Specification<Transaction> createSpecification(Long userId, String name, LocalDate startDate,
            LocalDate endDate, Long categoryId, String transactionType) {
        return (Root<Transaction> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));
            if (name != null && !name.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("creationDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("creationDate"), endDate));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (transactionType != null && !transactionType.isEmpty()) {
                try {
                    predicates.add(cb.equal(root.get("transactionType"),
                            TransactionType.valueOf(transactionType)));
                } catch (IllegalArgumentException e) {
                    // Log invalid type if needed
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public ByteArrayInputStream exportTransactions(String name, LocalDate startDate, LocalDate endDate, Long categoryId,
            String transactionType) {
        User user = userContextService.getCurrentUserOrThrow();

        // Fetch Transactions
        Specification<Transaction> spec = createSpecification(user.getId(), name, startDate, endDate, categoryId,
                transactionType);
        List<Transaction> transactions = transactionRepository.findAll(spec);

        // Fetch All Monthly Plannings for the user (could filter by date range if
        // needed, but for now export all)
        List<br.com.fabioprada.financial.model.MonthlyPlanning> plannings = monthlyPlanningRepository
                .findAllByUserId(user.getId());

        return excelService.exportToExcel(transactions, plannings);
    }

    @Transactional
    public void importTransactions(MultipartFile file) {
        try {
            User user = userContextService.getCurrentUserOrThrow();
            br.com.fabioprada.financial.dto.ImportDataDTO data = excelService.importData(file.getInputStream());
            List<Transaction> transactions = data.getTransactions();
            List<br.com.fabioprada.financial.model.MonthlyPlanning> plannings = data.getMonthlyPlannings();

            // --- Save Transactions ---
            for (Transaction transaction : transactions) {
                transaction.setUser(user);

                // Handle Category
                if (transaction.getCategory() != null && transaction.getCategory().getName() != null) {
                    String categoryName = transaction.getCategory().getName().trim();
                    Category category = categoryRepository.findByNameIgnoreCaseAndUserId(categoryName, user.getId())
                            .orElseGet(() -> {
                                Category newCategory = new Category();
                                newCategory.setName(categoryName);
                                newCategory.setUser(user);
                                return categoryRepository.save(newCategory);
                            });
                    transaction.setCategory(category);
                }

                // Handle Out Account
                if (transaction.getOutAccount() != null && transaction.getOutAccount().getName() != null) {
                    String accountName = transaction.getOutAccount().getName().trim();
                    Account account = accountRepository.findByNameIgnoreCaseAndUserId(accountName, user.getId())
                            .orElseGet(() -> {
                                Account newAccount = new Account();
                                newAccount.setName(accountName);
                                newAccount.setUser(user);
                                newAccount.setInitialBalance(BigDecimal.ZERO);
                                newAccount.setCurrentBalance(BigDecimal.ZERO);
                                return accountRepository.save(newAccount);
                            });
                    transaction.setOutAccount(account);
                }

                // Handle In Account
                if (transaction.getInAccount() != null && transaction.getInAccount().getName() != null) {
                    String accountName = transaction.getInAccount().getName().trim();
                    Account account = accountRepository.findByNameIgnoreCaseAndUserId(accountName, user.getId())
                            .orElseGet(() -> {
                                Account newAccount = new Account();
                                newAccount.setName(accountName);
                                newAccount.setUser(user);
                                newAccount.setInitialBalance(BigDecimal.ZERO);
                                newAccount.setCurrentBalance(BigDecimal.ZERO);
                                return accountRepository.save(newAccount);
                            });
                    transaction.setInAccount(account);
                }

                save(transaction);
            }

            // --- Save Monthly Plannings ---
            for (br.com.fabioprada.financial.model.MonthlyPlanning planning : plannings) {
                planning.setUser(user);

                // Handle Category
                if (planning.getCategory() != null && planning.getCategory().getName() != null) {
                    String categoryName = planning.getCategory().getName().trim();
                    Category category = categoryRepository.findByNameIgnoreCaseAndUserId(categoryName, user.getId())
                            .orElseGet(() -> {
                                Category newCategory = new Category();
                                newCategory.setName(categoryName);
                                newCategory.setUser(user);
                                return categoryRepository.save(newCategory);
                            });
                    planning.setCategory(category);
                }

                monthlyPlanningRepository.save(planning);
            }

        } catch (IOException e) {
            throw new RuntimeException("fail to store excel data: " + e.getMessage());
        }
    }

    public List<Transaction> findAllByUserId() {
        return userContextService.getCurrentUser()
                .map(user -> transactionRepository.findAllByUserId(user.getId()))
                .orElse(Collections.emptyList());
    }

    public Optional<Transaction> findByIdAndUserId(Long id) {
        return userContextService.getCurrentUser()
                .flatMap(user -> transactionRepository.findByIdAndUserId(id, user.getId()));
    }

    @Transactional
    public Optional<Transaction> update(Long id, Transaction transactionDetails) {
        return findByIdAndUserId(id).map(transaction -> {
            BigDecimal oldAmount = transaction.getAmount();
            Account oldInAccount = transaction.getInAccount();
            Account oldOutAccount = transaction.getOutAccount();

            transaction.setName(transactionDetails.getName());
            transaction.setAmount(transactionDetails.getAmount());
            transaction.setCreationDate(transactionDetails.getCreationDate());
            transaction.setTransactionType(transactionDetails.getTransactionType());
            transaction.setCategory(transactionDetails.getCategory());
            transaction.setOutAccount(transactionDetails.getOutAccount());
            transaction.setInAccount(transactionDetails.getInAccount());

            Transaction saved = transactionRepository.save(transaction);
            updateBalancesForUpdate(saved, oldAmount, oldInAccount, oldOutAccount);
            return saved;
        });
    }

    @Transactional
    public Transaction save(Transaction transaction) {
        User user = userContextService.getCurrentUserOrThrow();
        transaction.setUser(user);

        if (transaction.getTotalInstallments() != null && transaction.getTotalInstallments() > 1 && transaction.getId() == null) {
            return saveInstallments(transaction, user);
        }

        Transaction saved = transactionRepository.save(transaction);
        updateBalancesForSave(saved);
        return saved;
    }

    private Transaction saveInstallments(Transaction transaction, User user) {
        if (transaction.getInstallmentNumber() == null) {
            transaction.setInstallmentNumber(1);
        }

        BigDecimal installmentAmount = transaction.getAmount().divide(
                BigDecimal.valueOf(transaction.getTotalInstallments()), 2, java.math.RoundingMode.HALF_UP);
        transaction.setAmount(installmentAmount);

        Transaction savedTransaction = transactionRepository.save(transaction);
        updateBalancesForSave(savedTransaction);

        for (int i = 2; i <= transaction.getTotalInstallments(); i++) {
            Transaction installment = new Transaction();
            installment.setUser(user);
            installment.setName(transaction.getName());
            installment.setAmount(installmentAmount);
            installment.setTransactionType(transaction.getTransactionType());
            installment.setCategory(transaction.getCategory());
            installment.setOutAccount(transaction.getOutAccount());
            installment.setInAccount(transaction.getInAccount());
            installment.setTotalInstallments(transaction.getTotalInstallments());
            installment.setInstallmentNumber(i);
            installment.setCreationDate(transaction.getCreationDate().plusMonths(i - 1));

            Transaction savedInstallment = transactionRepository.save(installment);
            updateBalancesForSave(savedInstallment);
        }
        return savedTransaction;
    }

    @Transactional
    public void deleteById(Long id) {
        userContextService.getCurrentUser().ifPresent(user -> transactionRepository.findByIdAndUserId(id, user.getId())
                .ifPresent(transaction -> {
                    updateBalancesForDelete(transaction);
                    transactionRepository.delete(transaction);
                }));
    }

    @Transactional
    public void deleteMultiple(List<Long> ids) {
        userContextService.getCurrentUser().ifPresent(user -> {
            Long userId = user.getId();
            for (Long id : ids) {
                transactionRepository.findByIdAndUserId(id, userId).ifPresent(transaction -> {
                    updateBalancesForDelete(transaction);
                    transactionRepository.delete(transaction);
                });
            }
        });
    }

    private void updateAccountBalance(Account account, BigDecimal amount, boolean isAddition) {
        if (account == null) return;
        Account acc = accountRepository.findById(account.getId()).orElse(account);
        BigDecimal current = acc.getCurrentBalance() != null ? acc.getCurrentBalance() : BigDecimal.ZERO;
        if (isAddition) {
            acc.setCurrentBalance(current.add(amount));
        } else {
            acc.setCurrentBalance(current.subtract(amount));
        }
        accountRepository.save(acc);
    }

    private void updateBalancesForSave(Transaction transaction) {
        if (transaction.getInAccount() != null) {
            updateAccountBalance(transaction.getInAccount(), transaction.getAmount(), true);
        }
        if (transaction.getOutAccount() != null) {
            updateAccountBalance(transaction.getOutAccount(), transaction.getAmount(), false);
        }
    }

    private void updateBalancesForDelete(Transaction transaction) {
        if (transaction.getInAccount() != null) {
            updateAccountBalance(transaction.getInAccount(), transaction.getAmount(), false);
        }
        if (transaction.getOutAccount() != null) {
            updateAccountBalance(transaction.getOutAccount(), transaction.getAmount(), true);
        }
    }

    private void updateBalancesForUpdate(Transaction newTx, BigDecimal oldAmount, Account oldInAcc, Account oldOutAcc) {
        if (oldInAcc != null) {
            updateAccountBalance(oldInAcc, oldAmount, false);
        }
        if (oldOutAcc != null) {
            updateAccountBalance(oldOutAcc, oldAmount, true);
        }

        if (newTx.getInAccount() != null) {
            updateAccountBalance(newTx.getInAccount(), newTx.getAmount(), true);
        }
        if (newTx.getOutAccount() != null) {
            updateAccountBalance(newTx.getOutAccount(), newTx.getAmount(), false);
        }
    }

    @Transactional
    public List<Transaction> syncTransactions(List<br.com.fabioprada.financial.dto.TransactionSyncDTO> dtos) {
        User user = userContextService.getCurrentUserOrThrow();
        List<Transaction> saved = new ArrayList<>();

        for (br.com.fabioprada.financial.dto.TransactionSyncDTO dto : dtos) {
            boolean exists = transactionRepository.existsByNameAndAmountAndCreationDateAndUserId(
                    dto.getName(), dto.getAmount(), dto.getCreationDate(), user.getId());
            
            if (exists) {
                continue;
            }

            Transaction transaction = new Transaction();
            transaction.setUser(user);
            transaction.setName(dto.getName());
            transaction.setAmount(dto.getAmount());
            transaction.setCreationDate(dto.getCreationDate());
            transaction.setTransactionType(dto.getTransactionType());
            transaction.setInstallmentNumber(dto.getInstallmentNumber());
            transaction.setTotalInstallments(dto.getTotalInstallments());

            Category category;
            if (dto.getCategoryName() != null && !dto.getCategoryName().trim().isEmpty()) {
                String catName = dto.getCategoryName().trim();
                category = categoryRepository.findByNameIgnoreCaseAndUserId(catName, user.getId())
                        .orElseGet(() -> {
                            Category newCat = new Category();
                            newCat.setName(catName);
                            newCat.setUser(user);
                            return categoryRepository.save(newCat);
                        });
            } else {
                category = transactionCategorizationService.categorize(dto.getName(), user);
            }
            transaction.setCategory(category);

            if (dto.getInAccountName() != null && !dto.getInAccountName().trim().isEmpty()) {
                String accName = dto.getInAccountName().trim();
                Account inAcc = accountRepository.findByNameIgnoreCaseAndUserId(accName, user.getId())
                        .orElseGet(() -> {
                            Account newAcc = new Account();
                            newAcc.setName(accName);
                            newAcc.setUser(user);
                            newAcc.setInitialBalance(BigDecimal.ZERO);
                            return accountRepository.save(newAcc);
                        });
                transaction.setInAccount(inAcc);
            }

            if (dto.getOutAccountName() != null && !dto.getOutAccountName().trim().isEmpty()) {
                String accName = dto.getOutAccountName().trim();
                Account outAcc = accountRepository.findByNameIgnoreCaseAndUserId(accName, user.getId())
                        .orElseGet(() -> {
                            Account newAcc = new Account();
                            newAcc.setName(accName);
                            newAcc.setUser(user);
                            newAcc.setInitialBalance(BigDecimal.ZERO);
                            return accountRepository.save(newAcc);
                        });
                transaction.setOutAccount(outAcc);
            }

            saved.add(save(transaction));
        }
        return saved;
    }
}
