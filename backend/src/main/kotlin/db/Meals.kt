package com.allerlens.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object Meals : Table("meals") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").references(Users.id)
    val imageHash = varchar("image_hash", 64)
    val description = text("description")
    val status = varchar("status", 16).default("pending") // pending, ready, error
    val calories = integer("calories").nullable()
    val protein = integer("protein").nullable()
    val carbs = integer("carbs").nullable()
    val fat = integer("fat").nullable()
    val restaurant = varchar("restaurant", 255).nullable()
    val recipeName = varchar("recipe_name", 255).nullable()
    val recipeUrl = text("recipe_url").nullable()
    val sourceConfidence = varchar("source_confidence", 16).nullable()
    val ingredients = text("ingredients")
    val allergens = text("allergens").default("[]")
    val alternative = text("alternative").nullable()
    val locationLabel = varchar("location_label", 255).nullable()
    val latitude = double("latitude").nullable()
    val longitude = double("longitude").nullable()
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex("uk_meals_user_image", userId, imageHash)
    }
}
