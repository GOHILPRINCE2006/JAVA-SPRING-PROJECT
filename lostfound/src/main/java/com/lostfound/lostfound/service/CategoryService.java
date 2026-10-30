package com.lostfound.lostfound.service;

import com.lostfound.lostfound.dto.CategoryRequest;
import com.lostfound.lostfound.entity.Category;
import com.lostfound.lostfound.repository.CategoryRepository;
import com.lostfound.lostfound.repository.ItemRepository;
import com.lostfound.lostfound.util.Validation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;

    // Create new category
    @Transactional
    public Category createCategory(CategoryRequest request) {
        String name = Validation.requireText(request.name(), "Name", 255);
        String description = Validation.optionalText(request.description(), "Description", 255);
        if (categoryRepository.existsByName(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists: " + name);
        }
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    // Get all categories
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Get category by ID
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    /**
     * Category.items is mapped with cascade ALL, so deleting a category that still has items would silently
     * delete those items (and their claims). Refuse instead.
     */
    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found");
        }
        if (itemRepository.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This category is used by existing items and cannot be deleted");
        }
        categoryRepository.deleteById(id);
    }
}
