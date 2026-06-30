package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.model.Category;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.CategoryRepository;
import br.com.fabioprada.financial.security.UserContextService;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserContextService userContextService;
    private final br.com.fabioprada.financial.repository.TransactionRepository transactionRepository;
    private final br.com.fabioprada.financial.repository.MonthlyPlanningRepository monthlyPlanningRepository;

    public CategoryService(CategoryRepository categoryRepository, 
                           UserContextService userContextService,
                           br.com.fabioprada.financial.repository.TransactionRepository transactionRepository,
                           br.com.fabioprada.financial.repository.MonthlyPlanningRepository monthlyPlanningRepository) {
        this.categoryRepository = categoryRepository;
        this.userContextService = userContextService;
        this.transactionRepository = transactionRepository;
        this.monthlyPlanningRepository = monthlyPlanningRepository;
    }

    public List<Category> findAll() {
        return userContextService.getCurrentUser()
                .map(user -> categoryRepository.findAllByUserId(user.getId()))
                .orElse(Collections.emptyList());
    }

    public Optional<Category> findById(Long id) {
        return userContextService.getCurrentUser()
                .flatMap(user -> categoryRepository.findByIdAndUserId(id, user.getId()));
    }

    public Category save(Category category) {
        User user = userContextService.getCurrentUserOrThrow();
        category.setUser(user);
        return categoryRepository.save(category);
    }

    public void deleteById(Long id) {
        userContextService.getCurrentUser().ifPresent(user -> {
            Long userId = user.getId();
            categoryRepository.findByIdAndUserId(id, userId).ifPresent(category -> {
                transactionRepository.deselectCategory(id, userId);
                monthlyPlanningRepository.deleteByCategoryIdAndUserId(id, userId);
                categoryRepository.delete(category);
            });
        });
    }

    public void deleteMultiple(List<Long> ids) {
        userContextService.getCurrentUser().ifPresent(user -> {
            Long userId = user.getId();
            for (Long id : ids) {
                categoryRepository.findByIdAndUserId(id, userId).ifPresent(category -> {
                    transactionRepository.deselectCategory(id, userId);
                    monthlyPlanningRepository.deleteByCategoryIdAndUserId(id, userId);
                    categoryRepository.delete(category);
                });
            }
        });
    }
}
