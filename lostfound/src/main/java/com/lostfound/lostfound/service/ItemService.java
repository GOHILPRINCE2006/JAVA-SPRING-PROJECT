package com.lostfound.lostfound.service;

import com.lostfound.lostfound.dto.ItemRequest;
import com.lostfound.lostfound.entity.Category;
import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.repository.CategoryRepository;
import com.lostfound.lostfound.repository.ItemRepository;
import com.lostfound.lostfound.security.AccessRules;
import com.lostfound.lostfound.util.Validation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;

    // Report a new item (lost or found). The reporter is always the authenticated user.
    @Transactional
    public Item reportItem(ItemRequest request, Long categoryId, User reporter) {
        String title = Validation.requireText(request.title(), "Title", 255);
        String location = Validation.requireText(request.location(), "Location", 255);
        String description = Validation.optionalText(request.description(), "Description", 1000);
        Item.ItemStatus status = request.status();
        if (status != Item.ItemStatus.LOST && status != Item.ItemStatus.FOUND) {
            throw Validation.badRequest("Status must be LOST or FOUND");
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        Item item = new Item();
        item.setTitle(title);
        item.setDescription(description);
        item.setLocation(location);
        item.setStatus(status);
        item.setCategory(category);
        item.setReportedBy(reporter);
        return itemRepository.save(item);
    }

    // Get all items
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    // Get item by ID
    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    // Get items by status (LOST, FOUND, CLAIMED, RESOLVED)
    public List<Item> getItemsByStatus(Item.ItemStatus status) {
        return itemRepository.findByStatus(status);
    }

    // Get items by category
    public List<Item> getItemsByCategory(Long categoryId) {
        return itemRepository.findByCategoryId(categoryId);
    }

    // Get items reported by a user
    public List<Item> getItemsByUser(Long userId) {
        return itemRepository.findByReportedById(userId);
    }

    // Delete item: only the reporter or an admin
    @Transactional
    public void deleteItem(Long id, User current) {
        Item item = getItemById(id);
        boolean owner = AccessRules.isSelf(current, item.getReportedBy().getId());
        if (!owner && !AccessRules.isAdmin(current)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own items");
        }
        itemRepository.delete(item);
    }
}
