package br.com.fabioprada.financial.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    private final RestTemplate restTemplate;

    public EmailService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendSimpleMessage(String to, String subject, String text) {
        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.set("api-key", brevoApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        Map<String, Object> sender = new HashMap<>();
        sender.put("name", "SyncWallet API");
        sender.put("email", "syncwallett@gmail.com");

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);

        Map<String, Object> body = new HashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(recipient));
        body.put("subject", subject);

        // Convert simple text into minimal HTML
        body.put("htmlContent", "<p>" + text.replace("\n", "<br>") + "</p>");

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, requestEntity, String.class);
            System.out.println("Email enviado com sucesso via Brevo API para: " + to);
        } catch (Exception e) {
            System.err.println("Erro ao enviar email pelo Brevo API: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
