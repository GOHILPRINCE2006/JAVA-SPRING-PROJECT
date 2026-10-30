package com.lostfound.lostfound.controller;

import com.lostfound.lostfound.dto.ApiResponse;
import com.lostfound.lostfound.dto.CategoryRequest;
import com.lostfound.lostfound.dto.CategoryResponse;
import com.lostfound.lostfound.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // POST /api/categories - Create new category (admin only, SecurityConfig)
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryRequest request) {
        return ResponseEntity.ok(CategoryResponse.from(categoryService.createCategory(request)));
    }

    // GET /api/categories - public
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories().stream().map(CategoryResponse::from).toList());
    }

    // GET /api/categories/{id} - public
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(CategoryResponse.from(categoryService.getCategoryById(id)));
    }

    // DELETE /api/categories/{id} - admin only (SecurityConfig); refused while items use the category
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }
}
