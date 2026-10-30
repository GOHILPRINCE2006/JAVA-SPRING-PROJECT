package com.lostfound.lostfound.dto;

import com.lostfound.lostfound.entity.Item;

/** Fields a client may set when reporting an item. Reporter, id and timestamps are server-controlled. */
public record ItemRequest(String title, String description, String location, Item.ItemStatus status) {
}
