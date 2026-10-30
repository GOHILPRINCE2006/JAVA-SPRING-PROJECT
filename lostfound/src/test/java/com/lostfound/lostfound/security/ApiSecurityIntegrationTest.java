package com.lostfound.lostfound.security;

import com.lostfound.lostfound.entity.Category;
import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.entity.UserRole;
import com.lostfound.lostfound.repository.CategoryRepository;
import com.lostfound.lostfound.repository.ClaimRepository;
import com.lostfound.lostfound.repository.ItemRepository;
import com.lostfound.lostfound.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end security and flow tests against the real Spring Security filter chain and an in-memory H2 database.
 * They cover login persistence, public vs protected routes, role restrictions, IDOR, privilege escalation,
 * password leakage, CSRF, CORS and the item/claim business flow.
 */
@SpringBootTest
class ApiSecurityIntegrationTest {

    private static final String PASSWORD = "Passw0rd!";

    @Autowired private WebApplicationContext context;
    @Autowired private UserRepository userRepository;
    @Autowired private ItemRepository itemRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ClaimRepository claimRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private MockMvc mvc;
    private User alice;   // regular user, reports items
    private User bob;     // regular user, claims items
    private User admin;
    private Category category;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        claimRepository.deleteAll();
        itemRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        alice = saveUser("alice@example.com", "Alice", UserRole.USER);
        bob = saveUser("bob@example.com", "Bob", UserRole.USER);
        admin = saveUser("admin@example.com", "Admin", UserRole.ADMIN);

        category = new Category();
        category.setName("Wallets");
        category = categoryRepository.save(category);
    }

    private User saveUser(String email, String name, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        return userRepository.save(user);
    }

    private Item saveItem(User reporter, Item.ItemStatus status) {
        Item item = new Item();
        item.setTitle("Black wallet");
        item.setDescription("Found near the library");
        item.setLocation("Library");
        item.setStatus(status);
        item.setCategory(category);
        item.setReportedBy(reporter);
        return itemRepository.save(item);
    }

    private MockHttpSession login(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/users/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    // ---------------------------------------------------------------- authentication

    @Test
    void loginPersistsAcrossRequestsAndNeverLeaksPassword() throws Exception {
        mvc.perform(get("/api/users/profile/me")).andExpect(status().isUnauthorized());

        MockHttpSession session = login("alice@example.com");

        mvc.perform(get("/api/users/profile/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("alice@example.com"))
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(content().string(not(containsString("password"))));
    }

    @Test
    void loginWithWrongPasswordIsGeneric401() throws Exception {
        mvc.perform(post("/api/users/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alice@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void logoutEndsTheSession() throws Exception {
        MockHttpSession session = login("alice@example.com");
        mvc.perform(post("/api/users/logout").with(csrf()).session(session)).andExpect(status().isOk());
        mvc.perform(get("/api/users/profile/me").session(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void csrfEndpointIsPublicAndReturnsToken() throws Exception {
        mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void mutatingRequestWithoutCsrfTokenIsRejected() throws Exception {
        mvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alice@example.com\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Invalid or missing CSRF token"));
    }

    // ---------------------------------------------------------------- registration

    @Test
    void registrationAlwaysCreatesUserRoleAndReturnsNoPassword() throws Exception {
        mvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Mallory\",\"email\":\"mallory@example.com\","
                                + "\"password\":\"Passw0rd!\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(content().string(not(containsString("password"))));

        assertEquals(UserRole.USER, userRepository.findByEmail("mallory@example.com").orElseThrow().getRole());
    }

    @Test
    void registrationValidatesInputAndDuplicates() throws Exception {
        mvc.perform(post("/api/users/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"email\":\"not-an-email\",\"password\":\"Passw0rd!\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/users/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"email\":\"x@example.com\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/users/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dup\",\"email\":\"alice@example.com\",\"password\":\"Passw0rd!\"}"))
                .andExpect(status().isConflict());
    }

    // ---------------------------------------------------------------- public vs protected

    @Test
    void publicItemsAndCategoriesAreReadableWithoutLoginAndLeakNothingPrivate() throws Exception {
        Item item = saveItem(alice, Item.ItemStatus.FOUND);

        mvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Black wallet"))
                .andExpect(jsonPath("$[0].reportedBy.name").value("Alice"))
                .andExpect(content().string(not(containsString("password"))))
                .andExpect(content().string(not(containsString("alice@example.com"))));
        mvc.perform(get("/api/items/" + item.getId())).andExpect(status().isOk());
        mvc.perform(get("/api/categories")).andExpect(status().isOk());
        mvc.perform(get("/api/items/9999")).andExpect(status().isNotFound());
    }

    @Test
    void privateRoutesRequireLogin() throws Exception {
        mvc.perform(get("/api/items/user/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/items/user/" + alice.getId())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/claims/user/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/items?categoryId=" + category.getId()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"t\",\"location\":\"l\",\"status\":\"LOST\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownRoutesAreNotExposed() throws Exception {
        MockHttpSession session = login("admin@example.com");
        mvc.perform(get("/actuator/env").session(session)).andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- role restrictions

    @Test
    void regularUserCannotUseAdminEndpoints() throws Exception {
        MockHttpSession session = login("bob@example.com");
        Item item = saveItem(alice, Item.ItemStatus.FOUND);

        mvc.perform(get("/api/users").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/claims").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/claims/item/" + item.getId()).session(session)).andExpect(status().isForbidden());
        mvc.perform(post("/api/categories").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Keys\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/categories/" + category.getId()).with(csrf()).session(session))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/claims/1/status?status=APPROVED").with(csrf()).session(session))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/users/" + alice.getId()).with(csrf()).session(session))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanListUsersWithoutPasswords() throws Exception {
        MockHttpSession session = login("admin@example.com");
        mvc.perform(get("/api/users").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(content().string(not(containsString("password"))));
    }

    // ---------------------------------------------------------------- IDOR and privilege escalation

    @Test
    void userCannotReadOrModifyAnotherUsersData() throws Exception {
        MockHttpSession session = login("alice@example.com");
        mvc.perform(get("/api/users/" + bob.getId()).session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/claims/user/" + bob.getId()).session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/items/user/" + bob.getId()).session(session)).andExpect(status().isForbidden());
        mvc.perform(put("/api/users/" + bob.getId()).with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Hacked\"}"))
                .andExpect(status().isForbidden());
        assertEquals("Bob", userRepository.findById(bob.getId()).orElseThrow().getName());
    }

    @Test
    void userCannotPromoteThemselfToAdmin() throws Exception {
        MockHttpSession session = login("alice@example.com");
        mvc.perform(put("/api/users/" + alice.getId()).with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Alice B\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Alice B"))
                .andExpect(jsonPath("$.data.role").value("USER"));
        assertEquals(UserRole.USER, userRepository.findById(alice.getId()).orElseThrow().getRole());
    }

    @Test
    void passwordChangeRequiresCurrentPassword() throws Exception {
        MockHttpSession session = login("alice@example.com");
        mvc.perform(put("/api/users/" + alice.getId()).with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"nope\",\"newPassword\":\"NewPassw0rd!\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/users/" + alice.getId()).with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"NewPassw0rd!\"}"))
                .andExpect(status().isOk());
    }

    // ---------------------------------------------------------------- items

    @Test
    void reportItemUsesAuthenticatedUserAndValidatesInput() throws Exception {
        MockHttpSession session = login("alice@example.com");
        String url = "/api/items?categoryId=" + category.getId();

        mvc.perform(post(url).with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Keys\",\"description\":\"Three keys\",\"location\":\"Gym\","
                                + "\"status\":\"LOST\",\"reportedBy\":{\"id\":" + bob.getId() + "}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportedBy.id").value(alice.getId()))
                .andExpect(jsonPath("$.status").value("LOST"));

        // initial status must be LOST or FOUND
        mvc.perform(post(url).with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Keys\",\"location\":\"Gym\",\"status\":\"CLAIMED\"}"))
                .andExpect(status().isBadRequest());
        // missing title
        mvc.perform(post(url).with(csrf()).session(session).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"location\":\"Gym\",\"status\":\"LOST\"}"))
                .andExpect(status().isBadRequest());
        // unknown category
        mvc.perform(post("/api/items?categoryId=999999").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Keys\",\"location\":\"Gym\",\"status\":\"LOST\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void onlyOwnerOrAdminCanDeleteAnItem() throws Exception {
        Item item = saveItem(alice, Item.ItemStatus.FOUND);

        mvc.perform(delete("/api/items/" + item.getId()).with(csrf()).session(login("bob@example.com")))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/items/" + item.getId()).with(csrf()).session(login("alice@example.com")))
                .andExpect(status().isOk());
        assertEquals(0, itemRepository.count());
    }

    // ---------------------------------------------------------------- claims

    @Test
    void claimFlowFromSubmissionToApproval() throws Exception {
        Item item = saveItem(alice, Item.ItemStatus.FOUND);
        MockHttpSession bobSession = login("bob@example.com");
        MockHttpSession aliceSession = login("alice@example.com");
        MockHttpSession adminSession = login("admin@example.com");
        String claimUrl = "/api/claims?itemId=" + item.getId();
        String body = "{\"message\":\"It has my student card inside\"}";

        // the reporter cannot claim their own item
        mvc.perform(post(claimUrl).with(csrf()).session(aliceSession).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        // bob claims it: pending, and the item is NOT marked claimed yet
        mvc.perform(post(claimUrl).with(csrf()).session(bobSession).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.claimantEmail").doesNotExist());
        assertEquals(Item.ItemStatus.FOUND, itemRepository.findById(item.getId()).orElseThrow().getStatus());

        // duplicate active claim
        mvc.perform(post(claimUrl).with(csrf()).session(bobSession).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());

        // bob sees his claim; alice does not see it
        mvc.perform(get("/api/claims/user/me").session(bobSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/claims/user/me").session(aliceSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // admin reviews: sees claimant email, approves
        MvcResult list = mvc.perform(get("/api/claims").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].claimantEmail").value("bob@example.com"))
                .andReturn();
        Long claimId = claimRepository.findAll().get(0).getId();
        assertEquals(200, list.getResponse().getStatus());

        mvc.perform(put("/api/claims/" + claimId + "/status?status=APPROVED").with(csrf()).session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
        assertEquals(Item.ItemStatus.CLAIMED, itemRepository.findById(item.getId()).orElseThrow().getStatus());

        // invalid transition and invalid enum value
        mvc.perform(put("/api/claims/" + claimId + "/status?status=REJECTED").with(csrf()).session(adminSession))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/claims/" + claimId + "/status?status=BOGUS").with(csrf()).session(adminSession))
                .andExpect(status().isBadRequest());

        // the item can no longer be claimed
        mvc.perform(post(claimUrl).with(csrf()).session(login("admin@example.com"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void userCannotSeeOrDeleteSomeoneElsesClaim() throws Exception {
        Item item = saveItem(alice, Item.ItemStatus.FOUND);
        MockHttpSession bobSession = login("bob@example.com");
        mvc.perform(post("/api/claims?itemId=" + item.getId()).with(csrf()).session(bobSession)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"mine\"}"))
                .andExpect(status().isOk());
        Long claimId = claimRepository.findAll().get(0).getId();

        MockHttpSession aliceSession = login("alice@example.com");
        mvc.perform(get("/api/claims/" + claimId).session(aliceSession)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/claims/" + claimId).with(csrf()).session(aliceSession)).andExpect(status().isForbidden());

        // the claimant can withdraw a pending claim
        mvc.perform(delete("/api/claims/" + claimId).with(csrf()).session(bobSession)).andExpect(status().isOk());
        assertEquals(0, claimRepository.count());
    }

    // ---------------------------------------------------------------- categories

    @Test
    void adminCategoryManagementAndInUseProtection() throws Exception {
        MockHttpSession session = login("admin@example.com");

        mvc.perform(post("/api/categories").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Keys\",\"description\":\"All keys\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Keys"));
        mvc.perform(post("/api/categories").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Keys\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/categories").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"  \"}"))
                .andExpect(status().isBadRequest());

        // a category used by an item must not be deletable (and must not cascade-delete the item)
        saveItem(alice, Item.ItemStatus.LOST);
        mvc.perform(delete("/api/categories/" + category.getId()).with(csrf()).session(session))
                .andExpect(status().isConflict());
        assertEquals(1, itemRepository.count());
    }

    // ---------------------------------------------------------------- CORS

    @Test
    void corsAllowsOnlyConfiguredOriginWithCredentials() throws Exception {
        mvc.perform(options("/api/items")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));

        mvc.perform(options("/api/items")
                        .header("Origin", "http://evil.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
