package br.com.fabioprada.financial.repository;

import br.com.fabioprada.financial.model.MonthlyPlanning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonthlyPlanningRepository
        extends JpaRepository<MonthlyPlanning, Long>, JpaSpecificationExecutor<MonthlyPlanning> {
    @Query("SELECT mp FROM MonthlyPlanning mp WHERE mp.year = :year AND mp.month = :month AND mp.user.id = :userId")
    List<MonthlyPlanning> findByYearAndMonthAndUserId(@Param("year") int year, @Param("month") int month,
            @Param("userId") Long userId);

    List<MonthlyPlanning> findAllByUserId(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM MonthlyPlanning mp WHERE mp.category.id = :categoryId AND mp.user.id = :userId")
    void deleteByCategoryIdAndUserId(@Param("categoryId") Long categoryId, @Param("userId") Long userId);
}