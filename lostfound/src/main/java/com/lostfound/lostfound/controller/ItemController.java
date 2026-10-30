package com.lostfound.lostfound.controller;

import com.lostfound.lostfound.dto.ApiResponse;
import com.lostfound.lostfound.dto.ItemRequest;
import com.lostfound.lostfound.dto.ItemResponse;
import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.security.AccessRules;
import com.lostfound.lostfound.security.CurrentUserResolver;
import com.lostfound.lostfound.service.ItemService;
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
    private final CurrentUserResolver currentUserResolver;

    private static List<ItemResponse> toResponses(List<Item> items) {
        return items.stream().map(ItemResponse::from).toList();
    }

    // POST /api/items?categoryId=1 - Report a new item (reporter = authenticated user)
    @PostMapping
    public ResponseEntity<ItemResponse> reportItem(@RequestBody ItemRequest request,
                                                   @RequestParam Long categoryId,
                                                   Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(ItemResponse.from(itemService.reportItem(request, categoryId, user)));
    }

    // GET /api/items - public
    @GetMapping
    public ResponseEntity<List<ItemResponse>> getAllItems() {
        return ResponseEntity.ok(toResponses(itemService.getAllItems()));
    }

    // GET /api/items/{id} - public
    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(ItemResponse.from(itemService.getItemById(id)));
    }

    // GET /api/items/status?status=LOST - public
    @GetMapping("/status")
    public ResponseEntity<List<ItemResponse>> getItemsByStatus(@RequestParam Item.ItemStatus status) {
        return ResponseEntity.ok(toResponses(itemService.getItemsByStatus(status)));
    }

    // GET /api/items/category/{categoryId} - public
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ItemResponse>> getItemsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(toResponses(itemService.getItemsByCategory(categoryId)));
    }

    // GET /api/items/user/me - items reported by the authenticated user
    @GetMapping("/user/me")
    public ResponseEntity<List<ItemResponse>> getMyItems(Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(toResponses(itemService.getItemsByUser(user.getId())));
    }

    // GET /api/items/user/{userId} - admin only (SecurityConfig); re-checked here as defence in depth
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ItemResponse>> getItemsByUser(@PathVariable Long userId,
                                                             Authentication authentication) {
        User current = currentUserResolver.resolve(authentication);
        AccessRules.requireSelfOrAdmin(current, userId);
        return ResponseEntity.ok(toResponses(itemService.getItemsByUser(userId)));
    }

    // DELETE /api/items/{id} - reporter or admin
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteItem(@PathVariable Long id, Authentication authentication) {
        User current = currentUserResolver.resolve(authentication);
        itemService.deleteItem(id, current);
        return ResponseEntity.ok(ApiResponse.success("Item deleted successfully", null));
    }
}
