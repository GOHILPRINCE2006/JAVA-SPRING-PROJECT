package com.lostfound.lostfound.dto;

import com.lostfound.lostfound.entity.Item;

import java.time.LocalDateTime;

public record ItemResponse(
        Long id,
        String title,
        String description,
        String location,
        Item.ItemStatus status,
        LocalDateTime reportedAt,
        CategoryResponse category,
        UserSummary reportedBy) {

    public static ItemResponse from(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getLocation(),
                item.getStatus(),
                item.getReportedAt(),
                CategoryResponse.from(item.getCategory()),
                UserSummary.from(item.getReportedBy()));
    }
}
