package br.com.fabioprada.financial.controller;

import br.com.fabioprada.financial.service.HealthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping({"/health", "/api/health", "/api/auth/health"})
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = healthService.checkHealth();
        if ("UP".equals(status.get("status"))) {
            return ResponseEntity.ok(status);
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(status);
    }
}
