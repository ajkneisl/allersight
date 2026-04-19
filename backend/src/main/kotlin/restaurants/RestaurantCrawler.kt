package com.allerlens.restaurants

import com.allerlens.db.Meals
import com.allerlens.db.Restaurants
import com.allerlens.meals.TinyFishClient
import kotlinx.coroutines.*
import kotlinx.serialization.json.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import java.time.Instant

/**
 * Background queue that slowly discovers restaurants via TinyFish and computes
 * Allersense scores based on menu allergen density.
 *
 * Cycle:
 *  1. Collect distinct meal locations that have coordinates.
 *  2. For each location, ask TinyFish to find nearby restaurants.
 *  3. Insert any new restaurants into the DB.
 *  4. Pick the next un-analyzed restaurant and analyze its menu.
 *  5. Sleep between each step to stay within rate limits.
 */
class RestaurantCrawler(
    private val tinyFish: TinyFishClient,
    private val scope: CoroutineScope,
    private val delayBetweenMs: Long = 30_000,
) {
    private val log = LoggerFactory.getLogger("RestaurantCrawler")
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }
    private val commonAllergens = listOf("peanuts", "tree-nuts", "dairy", "eggs", "gluten", "soy", "shellfish", "fish", "sesame")

    fun start() {
        scope.launch {
            delay(10_000) // let the app finish booting
            log.info("RestaurantCrawler started")
            while (isActive) {
                try {
                    discoverRestaurants()
                    analyzeNext()
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    log.warn("Crawler cycle error: {}", e.message)
                }
                delay(delayBetweenMs)
            }
        }
    }

    /** Find distinct meal locations and ask TinyFish to discover restaurants nearby. */
    private suspend fun discoverRestaurants() {
        val locations = transaction {
            Meals.select(Meals.latitude, Meals.longitude)
                .where { Meals.latitude.isNotNull() and Meals.longitude.isNotNull() }
                .withDistinct()
                .map { it[Meals.latitude]!! to it[Meals.longitude]!! }
        }
        if (locations.isEmpty()) return

        // Pick one location per cycle to stay slow
        val (lat, lng) = locations.random()
        log.info("Discovering restaurants near ({}, {})", lat, lng)

        val goal = buildString {
            append("Search Google Maps for restaurants near latitude $lat, longitude $lng within 2km. ")
            append("Return JSON with key: restaurants (array of {name: string, lat: number, lng: number, placeId: string}). ")
            append("Include up to 10 restaurants. Return only the JSON object.")
        }

        val result = try {
            tinyFish.runAgentPublic("https://www.google.com/maps/@$lat,$lng,15z", goal)
        } catch (e: Exception) {
            log.warn("Discovery failed near ({}, {}): {}", lat, lng, e.message)
            return
        }

        val restaurants = parseDiscovery(result)
        log.info("Discovered {} restaurants", restaurants.size)

        transaction {
            for (r in restaurants) {
                val exists = Restaurants.selectAll().where { Restaurants.placeId eq r.placeId }.count() > 0
                if (!exists) {
                    Restaurants.insert {
                        it[placeId] = r.placeId
                        it[name] = r.name
                        it[Restaurants.lat] = r.lat
                        it[Restaurants.lng] = r.lng
                        it[certified] = false
                        it[allergenScore] = null
                        it[menuAnalysis] = "[]"
                    }
                    log.info("Added restaurant: {} ({})", r.name, r.placeId)
                }
            }
        }
    }

    /** Pick the next un-analyzed restaurant and compute its Allersense score. */
    private suspend fun analyzeNext() {
        val row = transaction {
            Restaurants.selectAll()
                .where { Restaurants.analyzedAt.isNull() }
                .orderBy(Restaurants.createdAt, SortOrder.ASC)
                .limit(1)
                .firstOrNull()
        } ?: return

        val id = row[Restaurants.id]
        val name = row[Restaurants.name]
        log.info("Analyzing menu for: {} (id={})", name, id)

        val goal = buildString {
            append("Search for the full menu of restaurant \"$name\". ")
            append("List every dish and identify which common allergens each contains ")
            append("(peanuts, tree-nuts, dairy, eggs, gluten, soy, shellfish, fish, sesame). ")
            append("Infer allergens from ingredients — e.g. cheese means dairy, bread means gluten. ")
            append("Return JSON with keys: ")
            append("dishes (array of {name: string, allergens: string[]}), ")
            append("totalCount (int, total dishes), ")
            append("allergenCounts (object mapping each allergen to how many dishes contain it). ")
            append("Return only the JSON object.")
        }

        val result = try {
            tinyFish.runAgentPublic("https://www.google.com", goal)
        } catch (e: Exception) {
            log.warn("Menu analysis failed for {}: {}", name, e.message)
            // Mark as analyzed with default score so we don't retry forever
            transaction {
                Restaurants.update({ Restaurants.id eq id }) {
                    it[allergenScore] = 50
                    it[analyzedAt] = Instant.now()
                }
            }
            return
        }

        val score = computeAllersenseScore(result)
        log.info("Allersense score for \"{}\": {}", name, score)

        transaction {
            Restaurants.update({ Restaurants.id eq id }) {
                it[allergenScore] = score
                it[menuAnalysis] = result.toString()
                it[analyzedAt] = Instant.now()
                // Auto-certify restaurants with very high safety scores
                if (score >= 85) it[certified] = true
            }
        }
    }

    /**
     * Allersense score: 0–100 where 100 = safest (fewest allergens across menu).
     * Formula: 100 - (average allergen count per dish / max possible allergens * 100)
     */
    private fun computeAllersenseScore(result: JsonElement): Int {
        return try {
            val root = when (result) {
                is JsonObject -> result["result"] as? JsonObject ?: result
                else -> json.parseToJsonElement(result.jsonPrimitive.content) as? JsonObject ?: return 50
            }
            val total = root["totalCount"]?.jsonPrimitive?.content?.toIntOrNull() ?: return 50
            if (total == 0) return 50

            val counts = root["allergenCounts"]?.jsonObject
            if (counts != null) {
                val totalAllergenHits = counts.values.sumOf {
                    it.jsonPrimitive.content.toIntOrNull() ?: 0
                }
                val avgPerDish = totalAllergenHits.toDouble() / total
                // Normalize: 0 allergens/dish = 100, 5+ allergens/dish = 0
                (100 - (avgPerDish / 5.0 * 100)).toInt().coerceIn(0, 100)
            } else {
                // Fallback: count dishes with any allergens
                val dishes = root["dishes"]?.jsonArray ?: return 50
                val withAllergens = dishes.count { dish ->
                    val allergens = dish.jsonObject["allergens"]?.jsonArray
                    allergens != null && allergens.isNotEmpty()
                }
                val safeRatio = 1.0 - (withAllergens.toDouble() / total)
                (safeRatio * 100).toInt().coerceIn(0, 100)
            }
        } catch (_: Exception) { 50 }
    }

    private data class DiscoveredRestaurant(val name: String, val placeId: String, val lat: Double, val lng: Double)

    private fun parseDiscovery(element: JsonElement): List<DiscoveredRestaurant> {
        return try {
            val root = when (element) {
                is JsonObject -> element["result"] as? JsonObject ?: element
                else -> json.parseToJsonElement(element.jsonPrimitive.content) as? JsonObject ?: return emptyList()
            }
            val arr = root["restaurants"]?.jsonArray ?: return emptyList()
            arr.mapNotNull { el ->
                val obj = el.jsonObject
                val name = obj["name"]?.jsonPrimitive?.content ?: return@mapNotNull null
                val placeId = obj["placeId"]?.jsonPrimitive?.content ?: name.lowercase().replace(" ", "-")
                val lat = obj["lat"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: return@mapNotNull null
                val lng = obj["lng"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: return@mapNotNull null
                DiscoveredRestaurant(name, placeId, lat, lng)
            }
        } catch (_: Exception) { emptyList() }
    }
}
