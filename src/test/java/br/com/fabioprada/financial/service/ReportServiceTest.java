package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.dto.ReportResponseDTO;
import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.UserRepository;
import br.com.fabioprada.financial.security.UserContextService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("dev")
public class ReportServiceTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private UserContextService userContextService;

    @Test
    public void testGenerateReport() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user != null) {
            Mockito.when(userContextService.getCurrentUserOrThrow()).thenReturn(user);
            ReportResponseDTO report = reportService.generateReport(6, 2026);
            assertNotNull(report);
        }
    }
}
