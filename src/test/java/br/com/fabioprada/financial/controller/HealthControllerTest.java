package br.com.fabioprada.financial.controller;

import br.com.fabioprada.financial.service.HealthService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

public class HealthControllerTest {

    private HealthService healthService;
    private HealthController healthController;

    @BeforeEach
    public void setUp() {
        healthService = Mockito.mock(HealthService.class);
        healthController = new HealthController(healthService);
    }

    @Test
    public void testHealthWhenUp() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("database", "UP");

        Mockito.when(healthService.checkHealth()).thenReturn(status);

        ResponseEntity<Map<String, Object>> response = healthController.health();

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals("UP", response.getBody().get("status"));
    }

    @Test
    public void testHealthWhenDown() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "DOWN");
        status.put("database", "DOWN");

        Mockito.when(healthService.checkHealth()).thenReturn(status);

        ResponseEntity<Map<String, Object>> response = healthController.health();

        Assertions.assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        Assertions.assertEquals("DOWN", response.getBody().get("status"));
    }
}
