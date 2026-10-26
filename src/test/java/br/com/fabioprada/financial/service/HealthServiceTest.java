package br.com.fabioprada.financial.service;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

public class HealthServiceTest {

    private DataSource dataSource;
    private Connection connection;
    private HealthService healthService;

    @BeforeEach
    public void setUp() {
        dataSource = Mockito.mock(DataSource.class);
        connection = Mockito.mock(Connection.class);
        healthService = new HealthService(dataSource);
    }

    @Test
    public void testCheckHealthSuccess() throws SQLException {
        Mockito.when(dataSource.getConnection()).thenReturn(connection);
        Mockito.when(connection.isValid(3)).thenReturn(true);

        Map<String, Object> result = healthService.checkHealth();

        Assertions.assertEquals("UP", result.get("status"));
        Assertions.assertEquals("UP", result.get("database"));
        Assertions.assertNotNull(result.get("timestamp"));
    }

    @Test
    public void testCheckHealthDatabaseInvalid() throws SQLException {
        Mockito.when(dataSource.getConnection()).thenReturn(connection);
        Mockito.when(connection.isValid(3)).thenReturn(false);

        Map<String, Object> result = healthService.checkHealth();

        Assertions.assertEquals("DOWN", result.get("status"));
        Assertions.assertEquals("DOWN", result.get("database"));
    }

    @Test
    public void testCheckHealthDatabaseThrowsException() throws SQLException {
        Mockito.when(dataSource.getConnection()).thenThrow(new SQLException("Connection refused"));

        Map<String, Object> result = healthService.checkHealth();

        Assertions.assertEquals("DOWN", result.get("status"));
        Assertions.assertEquals("DOWN", result.get("database"));
        Assertions.assertEquals("Connection refused", result.get("error"));
    }
}
