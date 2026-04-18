package com.allerlens.db

import io.ktor.server.application.Application
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
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
            SchemaUtils.create(Users, Meals, UserProfiles, Friends, Recipes, Notifications, FriendRequests)
        }
    }
}
