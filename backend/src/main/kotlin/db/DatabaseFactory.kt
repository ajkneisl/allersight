package com.allerlens.db

import at.favre.lib.crypto.bcrypt.BCrypt
import io.ktor.server.application.Application
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init(app: Application) {
        val config = app.environment.config.config("database")
        val driver = config.property("driver").getString()
        val url = config.property("url").getString()
        val user = config.property("user").getString()
        val password = config.property("password").getString()

        Database.connect(url = url, driver = driver, user = user, password = password)

        transaction {
            SchemaUtils.create(Users, Meals, UserProfiles, Friends, Recipes, Notifications, FriendRequests, Restaurants)
            val statements = SchemaUtils.addMissingColumnsStatements(Users, Meals, UserProfiles, Friends, Recipes, Notifications, FriendRequests, Restaurants)
            for (sql in statements) {
                try { exec(sql) } catch (_: Exception) { }
            }
            seedCertifiedRestaurants()
            seedUsers()
        }
    }

    private fun seedUsers() {
        val email = "yord@allersight.com"
        if (Users.selectAll().where { Users.email eq email }.count() > 0) return
        val hash = BCrypt.withDefaults().hashToString(12, "password".toCharArray())
        Users.insert {
            it[Users.email] = email
            it[passwordHash] = hash
        }
    }

    private fun seedCertifiedRestaurants() {
        if (Restaurants.selectAll().where { Restaurants.certified eq true }.count() > 0) return

        data class Seed(val placeId: String, val name: String, val lat: Double, val lng: Double, val score: Int)
        val seeds = listOf(
            Seed("as-cert-1", "The Green Table", 47.6097, -122.3331, 92),
            Seed("as-cert-2", "Nourish Kitchen & Café", 47.6145, -122.3440, 88),
            Seed("as-cert-3", "SafePlate Bistro", 47.6023, -122.3295, 95),
            Seed("as-cert-4", "Harvest & Vine", 47.6180, -122.3500, 85),
            Seed("as-cert-5", "Pure Spoon", 47.6060, -122.3200, 90),
        )
        for (s in seeds) {
            Restaurants.insert {
                it[placeId] = s.placeId
                it[name] = s.name
                it[lat] = s.lat
                it[lng] = s.lng
                it[certified] = true
                it[allergenScore] = s.score
                it[analyzedAt] = java.time.Instant.now()
            }
        }
    }
}
