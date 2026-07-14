package br.com.fabioprada.financial.repository;

import org.springframework.lang.NonNull;
import br.com.fabioprada.financial.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByUserId(@NonNull Long userId);

    Optional<Category> findByIdAndUserId(@NonNull Long id, @NonNull Long userId);

    Optional<Category> findByNameAndUserId(@NonNull String name, @NonNull Long userId);

    Optional<Category> findByNameIgnoreCaseAndUserId(@NonNull String name, @NonNull Long userId);

    void deleteByIdAndUserId(@NonNull Long id, @NonNull Long userId);
}