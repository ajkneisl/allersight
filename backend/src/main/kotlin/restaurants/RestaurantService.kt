package com.allerlens.restaurants

import com.allerlens.db.Restaurants
import com.allerlens.db.UserProfiles
import com.allerlens.meals.TinyFishClient
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import java.time.Instant

class RestaurantService(private val tinyFish: TinyFishClient) {
    private val log = LoggerFactory.getLogger("RestaurantService")
    private val json = Json { ignoreUnknownKeys = true }
    private val stringList = ListSerializer(String.serializer())

    fun nearby(lat: Double, lng: Double, radiusKm: Double = 5.0): List<RestaurantResponse> = transaction {
        Restaurants.selectAll().map { row ->
            val d = haversine(lat, lng, row[Restaurants.lat], row[Restaurants.lng])
            if (d <= radiusKm) rowToResponse(row) else null
        }.filterNotNull()
    }

    fun getDetail(id: Long): RestaurantDetailResponse? = transaction {
        Restaurants.selectAll().where { Restaurants.id eq id }.firstOrNull()?.let { row ->
            val dishes = parseDishes(row[Restaurants.menuAnalysis])
            RestaurantDetailResponse(
                id = row[Restaurants.id], placeId = row[Restaurants.placeId],
                name = row[Restaurants.name], lat = row[Restaurants.lat], lng = row[Restaurants.lng],
                certified = row[Restaurants.certified], allergenScore = row[Restaurants.allergenScore],
                analyzed = row[Restaurants.analyzedAt] != null, dishes = dishes,
            )
        }
    }

    private fun parseDishes(raw: String): List<MenuDish> {
        return try {
            val el = json.parseToJsonElement(raw)
            val root = when (el) {
                is kotlinx.serialization.json.JsonObject -> el["result"] as? kotlinx.serialization.json.JsonObject ?: el
                else -> return emptyList()
            }
            val arr = root["dishes"]?.let { it as? kotlinx.serialization.json.JsonArray } ?: return emptyList()
            arr.mapNotNull { d ->
                val obj = d as? kotlinx.serialization.json.JsonObject ?: return@mapNotNull null
                val name = obj["name"]?.let { it as? kotlinx.serialization.json.JsonPrimitive }?.content ?: return@mapNotNull null
                val allergens = obj["allergens"]?.let { it as? kotlinx.serialization.json.JsonArray }
                    ?.mapNotNull { a -> (a as? kotlinx.serialization.json.JsonPrimitive)?.content }
                    ?: emptyList()
                MenuDish(name, allergens)
            }
        } catch (_: Exception) { emptyList() }
    }

    suspend fun analyze(placeId: String, name: String, lat: Double, lng: Double, userAllergens: List<String>): RestaurantResponse {
        // Dedup: skip if already analyzed
        val existing = transaction {
            Restaurants.selectAll().where { Restaurants.placeId eq placeId }.firstOrNull()
        }
        if (existing != null && existing[Restaurants.analyzedAt] != null) {
            return transaction { rowToResponse(existing) }
        }

        // Use TinyFish to find menu and analyze allergens
        val goal = buildString {
            append("Search for the full menu of restaurant \"$name\". ")
            append("List every dish and its ingredients. ")
            append("Then check which dishes contain these allergens: ${userAllergens.joinToString(", ")}. ")
            append("Return JSON with keys: ")
            append("dishes (array of {name: string, ingredients: string[], allergens: string[]}), ")
            append("safeCount (int, number of dishes free of all listed allergens), ")
            append("totalCount (int, total dishes found). ")
            append("Return only the JSON object.")
        }

        val menuAnalysis = try {
            tinyFish.runAgentPublic("https://www.google.com", goal)
        } catch (e: Exception) {
            log.warn("TinyFish menu analysis failed for {}: {}", name, e.message)
            null
        }

        val score = menuAnalysis?.let { computeScore(it.toString(), userAllergens) } ?: 50

        val now = Instant.now()
        transaction {
            if (existing != null) {
                Restaurants.update({ Restaurants.placeId eq placeId }) {
                    it[allergenScore] = score
                    it[Restaurants.menuAnalysis] = menuAnalysis?.toString() ?: "[]"
                    it[analyzedAt] = now
                }
            } else {
                Restaurants.insert {
                    it[Restaurants.placeId] = placeId
                    it[Restaurants.name] = name
                    it[Restaurants.lat] = lat
                    it[Restaurants.lng] = lng
                    it[certified] = false
                    it[allergenScore] = score
                    it[Restaurants.menuAnalysis] = menuAnalysis?.toString() ?: "[]"
                    it[analyzedAt] = now
                }
            }
        }

        return transaction {
            Restaurants.selectAll().where { Restaurants.placeId eq placeId }.first().let { rowToResponse(it) }
        }
    }

    private fun computeScore(analysisJson: String, userAllergens: List<String>): Int {
        return try {
            val el = json.parseToJsonElement(analysisJson)
            val obj = el as? kotlinx.serialization.json.JsonObject ?: return 50
            val safe = obj["safeCount"]?.toString()?.toIntOrNull() ?: return 50
            val total = obj["totalCount"]?.toString()?.toIntOrNull() ?: return 50
            if (total == 0) 50 else ((safe.toDouble() / total) * 100).toInt().coerceIn(0, 100)
        } catch (_: Exception) { 50 }
    }

    private fun rowToResponse(row: ResultRow) = RestaurantResponse(
        id = row[Restaurants.id],
        placeId = row[Restaurants.placeId],
        name = row[Restaurants.name],
        lat = row[Restaurants.lat],
        lng = row[Restaurants.lng],
        certified = row[Restaurants.certified],
        allergenScore = row[Restaurants.allergenScore],
        analyzed = row[Restaurants.analyzedAt] != null,
    )

    private fun haversine(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
        val r = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLng = Math.toRadians(lng2 - lng1)
        val a = Math.sin(dLat / 2).let { it * it } +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLng / 2).let { it * it }
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
}
