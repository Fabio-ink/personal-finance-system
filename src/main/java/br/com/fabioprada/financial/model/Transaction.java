package br.com.fabioprada.financial.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.CrossOrigin;

@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_transaction_user_date", columnList = "user_id, creation_date"),
        @Index(name = "idx_transaction_user_category", columnList = "user_id, category_id")
})
@CrossOrigin(origins = "http://localhost:5173") // Permite acesso do nosso frontend
@Data
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal amount; // Alterado de 'value' para 'amount'

    @Column(nullable = false)
    private LocalDate creationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "out_account_id")
    private Account outAccount;

    @ManyToOne
    @JoinColumn(name = "in_account_id")
    private Account inAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "installment_number")
    private Integer installmentNumber;

    @Column(name = "total_installments")
    private Integer totalInstallments;
}