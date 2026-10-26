package br.com.fabioprada.financial.service;

import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class HealthService {

    private final DataSource dataSource;

    public HealthService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Map<String, Object> checkHealth() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("timestamp", Instant.now().toString());

        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(3)) {
                status.put("database", "UP");
            } else {
                status.put("status", "DOWN");
                status.put("database", "DOWN");
            }
        } catch (Exception e) {
            status.put("status", "DOWN");
            status.put("database", "DOWN");
            status.put("error", e.getMessage());
        }

        return status;
    }
}
