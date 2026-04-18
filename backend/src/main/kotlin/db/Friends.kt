package com.allerlens.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object Friends : Table("friends") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").references(Users.id)
    val friendUserId = long("friend_user_id").references(Users.id)
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex("uk_friends_pair", userId, friendUserId)
    }
}
