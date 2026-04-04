package com.lostfound.lostfound.repository;

import com.lostfound.lostfound.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Get all items by status (e.g. all LOST items)
    List<Item> findByStatus(Item.ItemStatus status);

    // Get all items reported by a specific user
    List<Item> findByReportedById(Long userId);

    // Get all items in a specific category
    List<Item> findByCategoryId(Long categoryId);
}