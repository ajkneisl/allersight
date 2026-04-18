package com.allerlens.db

import org.jetbrains.exposed.sql.Table

object UserProfiles : Table("user_profiles") {
    val userId = long("user_id").references(Users.id).uniqueIndex()
    val name = varchar("name", 100).default("")
    val allergens = text("allergens").default("[]")
    val diet = varchar("diet", 32).default("none")
    val calorieGoal = integer("calorie_goal").default(2000)
    val proteinGoal = integer("protein_goal").default(140)
    val carbsGoal = integer("carbs_goal").default(220)
    val fatGoal = integer("fat_goal").default(60)

    override val primaryKey = PrimaryKey(userId)
}
