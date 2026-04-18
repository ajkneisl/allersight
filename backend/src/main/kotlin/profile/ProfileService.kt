package com.allerlens.profile

import com.allerlens.db.UserProfiles
import com.allerlens.db.Users
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.upsert

private val stringList = ListSerializer(String.serializer())

object ProfileService {

    fun get(userId: Long): ProfileResponse = transaction {
        val email = Users.selectAll().where { Users.id eq userId }.first()[Users.email]
        val row = UserProfiles.selectAll().where { UserProfiles.userId eq userId }.firstOrNull()
        if (row == null) {
            ProfileResponse(name = "", email = email, allergens = emptyList(), diet = "none",
                calorieGoal = 2000, proteinGoal = 140, carbsGoal = 220, fatGoal = 60)
        } else {
            val allergens = runCatching { Json.decodeFromString(stringList, row[UserProfiles.allergens]) }.getOrDefault(emptyList())
            ProfileResponse(
                name = row[UserProfiles.name], email = email, allergens = allergens,
                diet = row[UserProfiles.diet], calorieGoal = row[UserProfiles.calorieGoal],
                proteinGoal = row[UserProfiles.proteinGoal], carbsGoal = row[UserProfiles.carbsGoal],
                fatGoal = row[UserProfiles.fatGoal],
            )
        }
    }

    fun update(userId: Long, req: UpdateProfileRequest): ProfileResponse = transaction {
        UserProfiles.upsert {
            it[UserProfiles.userId] = userId
            req.name?.let { v -> it[name] = v }
            req.allergens?.let { v -> it[allergens] = Json.encodeToString(stringList, v) }
            req.diet?.let { v -> it[diet] = v }
            req.calorieGoal?.let { v -> it[calorieGoal] = v }
            req.proteinGoal?.let { v -> it[proteinGoal] = v }
            req.carbsGoal?.let { v -> it[carbsGoal] = v }
            req.fatGoal?.let { v -> it[fatGoal] = v }
        }
        get(userId)
    }
}
