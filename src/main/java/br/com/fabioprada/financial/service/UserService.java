package br.com.fabioprada.financial.service;

import br.com.fabioprada.financial.model.User;
import br.com.fabioprada.financial.model.Category;
import br.com.fabioprada.financial.model.PasswordResetToken;
import br.com.fabioprada.financial.repository.UserRepository;
import br.com.fabioprada.financial.repository.CategoryRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final br.com.fabioprada.financial.repository.PasswordResetTokenRepository passwordResetTokenRepository;
    private final CategoryRepository categoryRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            br.com.fabioprada.financial.repository.PasswordResetTokenRepository passwordResetTokenRepository,
            CategoryRepository categoryRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public User createUser(String name, String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        User savedUser = userRepository.save(user);

        // Initialize default categories
        createDefaultCategories(savedUser);

        return savedUser;
    }

    private void createDefaultCategories(User user) {
        java.util.List<String> defaultCategories = java.util.List.of(
            "Alimentação",
            "Assinaturas",
            "Investimentos",
            "Transporte",
            "Saúde",
            "Lazer",
            "Moradia",
            "Educação",
            "Outros"
        );
        for (String name : defaultCategories) {
            if (categoryRepository.findByNameAndUserId(name, user.getId()).isEmpty()) {
                Category category = new Category();
                category.setName(name);
                category.setUser(user);
                categoryRepository.save(category);
            }
        }
    }

    public User updateUserName(String email, String newName) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setName(newName);
        return userRepository.save(user);
    }

    public void createPasswordResetTokenForUser(User user, String token) {
        PasswordResetToken myToken = passwordResetTokenRepository.findByUserId(user.getId())
                .orElse(new PasswordResetToken());

        myToken.setUser(user);
        myToken.setToken(token);
        myToken.setExpiryDate(java.time.LocalDateTime.now().plusHours(24));
        passwordResetTokenRepository.save(myToken);
    }

    public void updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public java.util.Optional<User> getUserByPasswordResetToken(String token) {
        return passwordResetTokenRepository.findByToken(token)
                .filter(t -> !t.isExpired())
                .map(br.com.fabioprada.financial.model.PasswordResetToken::getUser);
    }
}
