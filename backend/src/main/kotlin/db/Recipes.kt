package com.allerlens.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object Recipes : Table("recipes") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").references(Users.id)
    val title = varchar("title", 255)
    val photo = text("photo").default("")
    val calories = integer("calories").default(0)
    val timeMinutes = integer("time_minutes").default(0)
    val allergens = text("allergens").default("[]")
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}
