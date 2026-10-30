package com.lostfound.lostfound.dto;

import com.lostfound.lostfound.entity.Item;

public record ItemSummary(Long id, String title, String location, Item.ItemStatus status) {
    public static ItemSummary from(Item item) {
        return item == null ? null
                : new ItemSummary(item.getId(), item.getTitle(), item.getLocation(), item.getStatus());
    }
}
