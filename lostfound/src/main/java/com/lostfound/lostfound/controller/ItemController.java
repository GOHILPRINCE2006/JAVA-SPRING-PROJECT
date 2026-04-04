package com.lostfound.lostfound.controller;

import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.service.ItemService;
import com.lostfound.lostfound.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final UserService userService;  // Add this

    // POST /api/items?categoryId=1 — Report a new item (userId from authenticated user)
    @PostMapping
    public ResponseEntity<Item> reportItem(@RequestBody Item item,
                                           @RequestParam Long categoryId,
                                           Authentication authentication) {
        // Get logged-in user's email from authentication
        String email = authentication.getName();
        User loggedInUser = userService.getUserByEmail(email);
        Long userId = loggedInUser.getId();

        return ResponseEntity.ok(itemService.reportItem(item, categoryId, userId));
    }

    // GET /api/items — Get all items
    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        return ResponseEntity.ok(itemService.getAllItems());
    }

    // GET /api/items/{id} — Get item by ID
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getItemById(id));
    }

    // GET /api/items/status?status=LOST — Get items by status
    @GetMapping("/status")
    public ResponseEntity<List<Item>> getItemsByStatus(@RequestParam Item.ItemStatus status) {
        return ResponseEntity.ok(itemService.getItemsByStatus(status));
    }

    // GET /api/items/category/{categoryId} — Get items by category
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Item>> getItemsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(itemService.getItemsByCategory(categoryId));
    }

    // GET /api/items/user — Get items by authenticated user (no userId needed)
    @GetMapping("/user/me")
    public ResponseEntity<List<Item>> getMyItems(Authentication authentication) {
        String email = authentication.getName();
        User loggedInUser = userService.getUserByEmail(email);
        Long userId = loggedInUser.getId();
        return ResponseEntity.ok(itemService.getItemsByUser(userId));
    }

    // GET /api/items/user/{userId} — Get items by specific user (admin only)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Item>> getItemsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(itemService.getItemsByUser(userId));
    }


    // DELETE /api/items/{id} — Delete item
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteItem(@PathVariable Long id,
                                             Authentication authentication) {
        // Optional: Check if logged-in user owns the item
        String email = authentication.getName();
        User loggedInUser = userService.getUserByEmail(email);

        Item existingItem = itemService.getItemById(id);
        if (!existingItem.getReportedBy().getId().equals(loggedInUser.getId())
                && !loggedInUser.getRole().toString().equals("ADMIN")) {
            throw new RuntimeException("You can only delete your own items");
        }

        itemService.deleteItem(id);
        return ResponseEntity.ok("Item deleted successfully");
    }
}