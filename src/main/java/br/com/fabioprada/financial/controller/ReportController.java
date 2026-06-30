package br.com.fabioprada.financial.controller;

import br.com.fabioprada.financial.dto.ReportResponseDTO;
import br.com.fabioprada.financial.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<ReportResponseDTO> getReport(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        
        LocalDate now = LocalDate.now();
        int targetMonth = month != null ? month : now.getMonthValue();
        int targetYear = year != null ? year : now.getYear();

        ReportResponseDTO report = reportService.generateReport(targetMonth, targetYear);
        return ResponseEntity.ok(report);
    }
}
