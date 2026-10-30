package com.lostfound.lostfound.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Authentication strategy: server-side HTTP session (JSESSIONID cookie, HttpOnly, SameSite) + CSRF token.
 * The SPA never sees or stores a credential or bearer token.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    // Used both by the login endpoint (to save the context) and by the filter chain (to load it).
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String[] allowedOrigins) {
        List<String> origins = Arrays.stream(allowedOrigins)
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        if (origins.isEmpty() || origins.contains("*")) {
            // Credentialed CORS must never use a wildcard.
            throw new IllegalStateException(
                    "app.cors.allowed-origins (CORS_ALLOWED_ORIGINS) must list explicit origins, not '*'");
        }

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Accept", "X-CSRF-TOKEN"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           SecurityContextRepository securityContextRepository,
                                           CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                // CSRF is ON. The token lives in the session and is handed to the SPA by GET /api/auth/csrf.
                .csrf(csrf -> csrf.csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .securityContext(context -> context.securityContextRepository(securityContextRepository))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()

                        // ---- Public ----
                        .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/register", "/api/users/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories", "/api/categories/*").permitAll()

                        // ---- Items: the private /user/** routes MUST come before the public item routes ----
                        .requestMatchers(HttpMethod.GET, "/api/items/user/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/items/user/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/items", "/api/items/*", "/api/items/category/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/items").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/items/*").authenticated() // owner/admin checked in service

                        // ---- Claims ----
                        .requestMatchers(HttpMethod.POST, "/api/claims").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/claims/user/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/claims", "/api/claims/user/*", "/api/claims/item/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/claims/*").authenticated() // claimant/admin checked in service
                        .requestMatchers(HttpMethod.PUT, "/api/claims/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/claims/*").authenticated() // claimant/admin checked in service

                        // ---- Users ----
                        .requestMatchers(HttpMethod.GET, "/api/users/profile/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/*").authenticated() // self/admin checked in controller
                        .requestMatchers(HttpMethod.PUT, "/api/users/*").authenticated() // self only, checked in service
                        .requestMatchers(HttpMethod.DELETE, "/api/users/*").hasRole("ADMIN")

                        // ---- Categories (admin writes) ----
                        .requestMatchers(HttpMethod.POST, "/api/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/*").hasRole("ADMIN")

                        // Anything not listed above is not part of the API.
                        .anyRequest().denyAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/api/users/logout") // POST + CSRF token; invalidates the session
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.OK)))
                .exceptionHandling(handling -> handling
                        // 401 as JSON (no WWW-Authenticate header, so browsers never show a Basic-auth popup)
                        .authenticationEntryPoint((request, response, exception) ->
                                writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required"))
                        .accessDeniedHandler((request, response, exception) -> writeJson(
                                response,
                                HttpServletResponse.SC_FORBIDDEN,
                                exception instanceof CsrfException
                                        ? "Invalid or missing CSRF token"
                                        : "You do not have permission to perform this action")));

        return http.build();
    }

    private static void writeJson(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\",\"data\":null}");
    }
}
