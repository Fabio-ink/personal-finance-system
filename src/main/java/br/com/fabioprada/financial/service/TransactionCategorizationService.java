package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.model.Category;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.CategoryRepository;
import org.springframework.stereotype.Service;

@Service
public class TransactionCategorizationService {

    private final CategoryRepository categoryRepository;

    public TransactionCategorizationService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category categorize(String description, User user) {
        String desc = description.toLowerCase();
        String categoryName;

        if (desc.contains("uber") || desc.contains("99app") || desc.contains("cabify") || desc.contains("taxi") || desc.contains("combustivel") || desc.contains("posto")) {
            categoryName = "Transport";
        } else if (desc.contains("ifood") || desc.contains("restaurante") || desc.contains("mercado") || desc.contains("supermercado") || desc.contains("padaria") || desc.contains("cafe") || desc.contains("food")) {
            categoryName = "Food";
        } else if (desc.contains("netflix") || desc.contains("spotify") || desc.contains("steam") || desc.contains("cinema") || desc.contains("jogos") || desc.contains("game")) {
            categoryName = "Entertainment";
        } else if (desc.contains("luz") || desc.contains("agua") || desc.contains("internet") || desc.contains("aluguel") || desc.contains("condominio") || desc.contains("energia")) {
            categoryName = "Housing";
        } else {
            categoryName = "Others";
        }

        String finalCategoryName = categoryName;
        return categoryRepository.findByNameAndUserId(finalCategoryName, user.getId())
                .orElseGet(() -> {
                    Category newCategory = new Category();
                    newCategory.setName(finalCategoryName);
                    newCategory.setUser(user);
                    return categoryRepository.save(newCategory);
                });
    }
}
