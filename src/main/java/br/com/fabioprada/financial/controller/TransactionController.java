package br.com.fabioprada.financial.controller;

import br.com.fabioprada.financial.model.Transaction;
import br.com.fabioprada.financial.service.TransactionService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public Page<Transaction> listAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("creationDate").descending());
        return transactionService.searchTransactions(name, startDate, endDate, categoryId, transactionType, pageable);
    }

    @PostMapping
    public Transaction create(@RequestBody Transaction transaction) {
        return transactionService.save(transaction);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updated(@PathVariable Long id, @RequestBody Transaction transactionDetails) {
        return transactionService.findByIdAndUserId(id)
                .map(transaction -> {
                    transaction.setName(transactionDetails.getName());
                    transaction.setAmount(transactionDetails.getAmount());
                    transaction.setCreationDate(transactionDetails.getCreationDate());
                    transaction.setTransactionType(transactionDetails.getTransactionType());
                    transaction.setCategory(transactionDetails.getCategory());
                    transaction.setOutAccount(transactionDetails.getOutAccount());
                    transaction.setInAccount(transactionDetails.getInAccount());
                    Transaction updated = transactionService.save(transaction);
                    return ResponseEntity.ok(updated);
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleter(@PathVariable Long id) {
        return transactionService.findByIdAndUserId(id)
                .map(transaction -> {
                    transactionService.deleteById(id);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/delete-multiple")
    public ResponseEntity<?> deleteMultiple(@RequestBody List<Long> ids) {
        transactionService.deleteMultiple(ids);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    public ResponseEntity<InputStreamResource> export(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String transactionType) {

        ByteArrayInputStream in = transactionService.exportTransactions(name, startDate, endDate, categoryId,
                transactionType);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=transactions.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @PostMapping("/import")
    public ResponseEntity<?> importTransactions(@RequestParam("file") MultipartFile file) {
        transactionService.importTransactions(file);
        return ResponseEntity.ok().build();
    }
}