package com.lostfound.lostfound.controller;

import com.lostfound.lostfound.dto.CsrfTokenResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // GET /api/auth/csrf: the SPA calls this once, then sends the token in the X-CSRF-TOKEN header
    // on every POST/PUT/DELETE. The token is bound to the server session.
    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(CsrfToken token) {
        return new CsrfTokenResponse(token.getHeaderName(), token.getToken());
    }
}
