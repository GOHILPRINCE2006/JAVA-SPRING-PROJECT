package com.lostfound.lostfound.service;

import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.Category;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.repository.ItemRepository;
import com.lostfound.lostfound.repository.CategoryRepository;
import com.lostfound.lostfound.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    // Report a new item (lost or found)
    public Item reportItem(Item item, Long categoryId, Long userId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        item.setCategory(category);
        item.setReportedBy(user);
        return itemRepository.save(item);
    }

    // Get all items
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    // Get item by ID
    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));
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



    // Delete item
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new RuntimeException("Item not found with id: " + id);
        }
        itemRepository.deleteById(id);
    }
}