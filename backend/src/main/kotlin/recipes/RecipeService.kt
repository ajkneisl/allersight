package com.allerlens.recipes

import com.allerlens.db.Friends
import com.allerlens.db.Recipes
import com.allerlens.db.UserProfiles
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

private val stringList = ListSerializer(String.serializer())

object RecipeService {

    private fun parseAllergens(raw: String): List<String> =
        runCatching { Json.decodeFromString(stringList, raw) }.getOrDefault(emptyList())

    fun list(userId: Long): List<RecipeResponse> = transaction {
        // Gather friend allergens
        val friendRows = Friends.selectAll().where { Friends.userId eq userId }
        val friendAllergens = mutableMapOf<Long, Set<String>>()
        for (row in friendRows) {
            val fid = row[Friends.friendUserId]
            val profile = UserProfiles.selectAll().where { UserProfiles.userId eq fid }.firstOrNull()
            friendAllergens[fid] = profile?.let { parseAllergens(it[UserProfiles.allergens]).toSet() } ?: emptySet()
        }

        Recipes.selectAll()
            .where { Recipes.userId eq userId }
            .orderBy(Recipes.createdAt, SortOrder.DESC)
            .limit(50)
            .map { row ->
                val recipeAllergens = parseAllergens(row[Recipes.allergens]).toSet()
                val safe = friendAllergens.filter { (_, fa) -> fa.intersect(recipeAllergens).isEmpty() }.keys.toList()
                RecipeResponse(
                    id = row[Recipes.id], title = row[Recipes.title],
                    photo = row[Recipes.photo], calories = row[Recipes.calories],
                    timeMinutes = row[Recipes.timeMinutes], allergens = recipeAllergens.toList(),
                    safeForFriends = safe,
                )
            }
    }
}
