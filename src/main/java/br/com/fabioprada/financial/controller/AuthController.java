package br.com.fabioprada.financial.controller;

import br.com.fabioprada.financial.dto.AuthResponse;
import br.com.fabioprada.financial.dto.LoginRequest;
import br.com.fabioprada.financial.dto.RegisterRequest;
import br.com.fabioprada.financial.security.JwtTokenProvider;
import br.com.fabioprada.financial.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final br.com.fabioprada.financial.service.EmailService emailService;

    public AuthController(AuthenticationManager authenticationManager, UserService userService,
            JwtTokenProvider jwtTokenProvider, br.com.fabioprada.financial.service.EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        userService.createUser(registerRequest.getName(), registerRequest.getEmail(), registerRequest.getPassword());
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        if (email != null && !email.trim().isEmpty()) {
            try {
                UserDetails userDetails = userService.loadUserByUsername(email);
                br.com.fabioprada.financial.model.User user = (br.com.fabioprada.financial.model.User) userDetails;

                String token = java.util.UUID.randomUUID().toString();
                userService.createPasswordResetTokenForUser(user, token);

                emailService.sendSimpleMessage(email, "Password Recovery - SyncWallet",
                        "Your recovery code is: " + token);
            } catch (Exception ignored) {
            }
        }
        return ResponseEntity.ok("If the email is registered, a recovery code has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body("Valid token and password are required.");
        }

        try {
            userService.resetPasswordWithToken(token, newPassword);
            return ResponseEntity.ok("Password changed successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid or expired token.");
        }
    }
}
