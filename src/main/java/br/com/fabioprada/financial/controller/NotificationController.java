package br.com.fabioprada.financial.controller;

import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.repository.UserRepository;
import br.com.fabioprada.financial.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.cron.token}")
    private String cronToken;

    public NotificationController(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @PostMapping("/monthly-alert")
    public ResponseEntity<?> sendMonthlyAlert(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Cron-Token", required = false) String xCronToken) {

        String token = null;
        if (xCronToken != null) {
            token = xCronToken;
        } else if (authorization != null && authorization.startsWith("Bearer ")) {
            token = authorization.substring(7);
        }

        if (token == null || !token.equals(cronToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing token.");
        }

        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                String htmlContent = buildHtmlContent(user.getName());
                emailService.sendHtmlMessage(user.getEmail(), "Seu Relatório Mensal está disponível - SyncWallet", htmlContent);
            }
        }

        return ResponseEntity.ok("Alerts sent successfully to " + users.size() + " users.");
    }

    private String buildHtmlContent(String name) {
        String displayName = name != null ? name : "Usuário";
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: sans-serif; background-color: #0d0e12; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #151823; border: 1px solid #27272a; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #3b82f6; text-align: center;">SyncWallet</h2>
                    <p>Olá, <strong>%s</strong>!</p>
                    <p>Seu relatório financeiro mensal está pronto para visualização no painel do SyncWallet.</p>
                    <p>Acompanhe seus gastos por categoria, verifique o progresso das suas metas e planeje seu próximo mês de forma inteligente.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s/reports" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Visualizar Relatório</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;">
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Este é um e-mail automático enviado pelo SyncWallet.</p>
                </div>
            </body>
            </html>
            """.formatted(displayName, frontendUrl);
    }
}
