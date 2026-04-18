package com.allerlens.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object Notifications : Table("notifications") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").references(Users.id)
    val type = varchar("type", 32) // "meal_scanned", "friend_request", "friend_accepted"
    val title = varchar("title", 255)
    val body = text("body")
    val read = bool("read").default(false)
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}

object FriendRequests : Table("friend_requests") {
    val id = long("id").autoIncrement()
    val fromUserId = long("from_user_id").references(Users.id)
    val toUserId = long("to_user_id").references(Users.id)
    val status = varchar("status", 16).default("pending") // pending, accepted, rejected
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex("uk_friend_req", fromUserId, toUserId)
    }
}
