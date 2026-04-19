package com.allerlens.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object Restaurants : Table("restaurants") {
    val id = long("id").autoIncrement()
    val placeId = varchar("place_id", 255).uniqueIndex()
    val name = varchar("name", 255)
    val lat = double("lat")
    val lng = double("lng")
    val certified = bool("certified").default(false)
    val allergenScore = integer("allergen_score").nullable()
    val menuAnalysis = text("menu_analysis").default("[]")
    val analyzedAt = timestamp("analyzed_at").nullable()
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }

    override val primaryKey = PrimaryKey(id)
}
