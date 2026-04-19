package com.allerlens.meals

import com.allerlens.db.Friends
import com.allerlens.db.Meals
import com.allerlens.db.Users
import com.allerlens.notifications.NotificationService
import com.allerlens.profile.ProfileService
import com.allerlens.vision.VisionHub
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import org.slf4j.LoggerFactory
import java.io.File
import java.security.MessageDigest
import java.util.Base64

object DietChecker {
    private val rules: Map<String, List<String>> = mapOf(
        "halal" to listOf("pork", "pepperoni", "bacon", "ham", "salami", "prosciutto", "lard", "gelatin", "pancetta", "chorizo", "sausage", "hot dog", "bratwurst"),
        "kosher" to listOf("pork", "pepperoni", "bacon", "ham", "salami", "prosciutto", "lard", "shellfish", "shrimp", "crab", "lobster", "clam", "mussel", "oyster", "scallop", "crawfish"),
        "vegetarian" to listOf("chicken", "beef", "pork", "lamb", "turkey", "duck", "veal", "venison", "bison", "bacon", "ham", "salami", "pepperoni", "prosciutto", "sausage", "hot dog", "steak", "ribs", "meatball", "ground meat", "anchovy", "shrimp", "crab", "lobster", "fish", "salmon", "tuna", "cod", "tilapia"),
        "vegan" to listOf("chicken", "beef", "pork", "lamb", "turkey", "duck", "veal", "bacon", "ham", "salami", "pepperoni", "prosciutto", "sausage", "steak", "meatball", "fish", "salmon", "tuna", "shrimp", "crab", "lobster", "anchovy", "dairy", "milk", "cheese", "butter", "cream", "yogurt", "egg", "honey", "whey", "casein", "gelatin", "mozzarella", "parmesan", "cheddar"),
        "pescatarian" to listOf("chicken", "beef", "pork", "lamb", "turkey", "duck", "veal", "venison", "bison", "bacon", "ham", "salami", "pepperoni", "prosciutto", "sausage", "hot dog", "steak", "ribs", "meatball", "ground meat"),
    )

    fun check(diet: String, ingredients: List<String>): List<String> {
        val banned = rules[diet] ?: return emptyList()
        val lower = ingredients.map { it.lowercase() }
        return banned.filter { b -> lower.any { it.contains(b) } }.map { "$it (not $diet)" }
    }
}

class DuplicateMealException(val existingId: Long) :
    RuntimeException("Meal image already saved")

class InvalidImageException(message: String) : RuntimeException(message)

private val stringListSerializer = ListSerializer(String.serializer())

class MealService(
    private val featherless: FeatherlessClient,
    private val tinyFish: TinyFishClient,
    private val scope: CoroutineScope,
) {
    private val log = LoggerFactory.getLogger("meals")
    private val imageDir = File("data/images").also { it.mkdirs() }
    private fun imageFile(id: Long): File = File(imageDir, "$id.jpg")

    fun getImageBytes(mealId: Long): ByteArray? {
        val f = imageFile(mealId)
        return if (f.exists()) f.readBytes() else null
    }

    /**
     * Returns 201 immediately. The actual DB insert happens after Featherless
     * analyzes the image so we have the real food name, calories, etc.
     */
    fun createMeal(userId: Long, request: CreateMealRequest): MealResponse {
        val bytes = decodeImage(request.image)
        if (bytes.isEmpty()) throw InvalidImageException("Image data is empty")

        val hash = sha256Hex(bytes)

        val existing = transaction {
            Meals.selectAll()
                .where { (Meals.userId eq userId) and (Meals.imageHash eq hash) }
                .firstOrNull()
        }
        if (existing != null) throw DuplicateMealException(existing[Meals.id])

        // Reserve a row with minimal data so the hash is claimed
        val id = transaction {
            Meals.insert {
                it[Meals.userId] = userId
                it[Meals.imageHash] = hash
                it[Meals.description] = request.description
                it[Meals.ingredients] = "[]"
                it[Meals.locationLabel] = request.location?.label
                it[Meals.latitude] = request.location?.latitude
                it[Meals.longitude] = request.location?.longitude
            } get Meals.id
        }

        imageFile(id).writeBytes(bytes)
        val imageBase64 = Base64.getEncoder().encodeToString(bytes)

        // Background: Featherless vision → DB update → TinyFish source → broadcast
        scope.launch {
            try {
                // 1. Featherless: analyze the image for name, calories, allergens
                val ai = featherless.analyzeImage(imageBase64, request.mimeType)

                // 2. Insert real data into DB
                transaction {
                    Meals.update({ Meals.id eq id }) {
                        it[status] = "ready"
                        it[description] = "${ai.name}\n${ai.description}".trim()
                        it[calories] = ai.calories
                        it[protein] = ai.protein
                        it[carbs] = ai.carbs
                        it[fat] = ai.fat
                        it[ingredients] = Json.encodeToString(stringListSerializer, ai.ingredients)
                        it[allergens] = Json.encodeToString(stringListSerializer, ai.allergens)
                    }
                }

                // Notify friends
                transaction {
                    val email = Users.selectAll().where { Users.id eq userId }.first()[Users.email]
                    val friendIds = Friends.selectAll().where { Friends.friendUserId eq userId }.map { it[Friends.userId] }
                    for (fid in friendIds) {
                        NotificationService.create(fid, "meal_scanned", "New food scanned", "$email scanned: ${ai.name}")
                    }
                }

                // Notify user if app is not open
                if (!VisionHub.hasStatusSubscriber(userId)) {
                    val profile = ProfileService.get(userId)
                    val flagged = ai.allergens.filter { it in profile.allergens }
                    val (title, body) = when {
                        flagged.isNotEmpty() -> "Watch out!" to "\"${ai.name}\" might contain ${flagged.joinToString(", ")}. Make sure to double check."
                        ai.calories != null && ai.calories > profile.calorieGoal -> "Hold on!" to "\"${ai.name}\" is ${ai.calories} cal — exceeds your goal of ${profile.calorieGoal} cal. Are you sure?"
                        else -> "Looks good!" to "\"${ai.name}\" looks good! No flagged allergens and fits your calorie goal."
                    }
                    NotificationService.create(userId, "meal_alert", title, body)
                }

                // Compute diet violations
                val dietProfile = ProfileService.get(userId)
                val dietViolations = DietChecker.check(dietProfile.diet, ai.ingredients)

                // Broadcast Featherless result to app
                val fullDescription = if (ai.description.isNotBlank()) "${ai.name} — ${ai.description}" else ai.name
                val featherlessResponse = MealResponse(
                    id = id, status = "ready", name = ai.name, description = ai.description,
                    calories = ai.calories, protein = ai.protein, carbs = ai.carbs, fat = ai.fat,
                    restaurant = null, recipeName = null, recipeUrl = null, sourceConfidence = null,
                    ingredients = ai.ingredients, allergens = ai.allergens, dietViolations = dietViolations,
                    location = request.location, imageUrl = "/meals/$id/image",
                    createdAt = java.time.Instant.now().toString(),
                )
                VisionHub.broadcastMeal(userId, Json.encodeToString(MealResponse.serializer(), featherlessResponse))

                // 3. TinyFish: find restaurant/recipe source
                try {
                    val s = tinyFish.analyzeMeal(
                        mealDescription = ai.name,
                        locationLabel = request.location?.label,
                    )
                    transaction {
                        Meals.update({ Meals.id eq id }) {
                            it[restaurant] = s.restaurant
                            it[recipeName] = s.recipeName
                            it[recipeUrl] = s.recipeUrl
                            it[sourceConfidence] = s.confidence
                        }
                    }
                    var enriched = featherlessResponse.copy(
                        restaurant = s.restaurant, recipeName = s.recipeName,
                        recipeUrl = s.recipeUrl, sourceConfidence = s.confidence,
                    )
                    VisionHub.broadcastMeal(userId, Json.encodeToString(MealResponse.serializer(), enriched))

                    // 4. If user has flagged allergens or diet violations, find an alternative
                    val profile = ProfileService.get(userId)
                    val flagged = ai.allergens.filter { it in profile.allergens }
                    if (flagged.isNotEmpty() || dietViolations.isNotEmpty()) {
                        val reasons = flagged + dietViolations
                        val alt = tinyFish.fetchAlternative(ai.name, reasons)
                        if (alt != null) {
                            transaction {
                                Meals.update({ Meals.id eq id }) {
                                    it[alternative] = alt
                                }
                            }
                            enriched = enriched.copy(alternative = alt)
                            VisionHub.broadcastMeal(userId, Json.encodeToString(MealResponse.serializer(), enriched))
                        }
                    }
                } catch (_: Exception) { /* TinyFish failure is non-fatal */ }

            } catch (_: NoFoodDetectedException) {
                log.warn("No food detected in meal {} — marking as error", id)
                transaction {
                    Meals.update({ Meals.id eq id }) {
                        it[status] = "error"
                        it[description] = "NOT_FOOD"
                    }
                }
                val errorResponse = MealResponse(
                    id = id, status = "error", name = "Not food", description = "NOT_FOOD",
                    calories = null, protein = null, carbs = null, fat = null,
                    restaurant = null, recipeName = null, recipeUrl = null, sourceConfidence = null,
                    ingredients = emptyList(), allergens = emptyList(),
                    location = request.location, imageUrl = "/meals/$id/image",
                    createdAt = java.time.Instant.now().toString(),
                )
                VisionHub.broadcastMeal(userId, Json.encodeToString(MealResponse.serializer(), errorResponse))
            } catch (e: Exception) {
                log.error("Featherless analysis failed for meal {}: {}", id, e.message, e)
                transaction {
                    Meals.update({ Meals.id eq id }) { it[status] = "error" }
                }
            }
        }

        // Return 201 immediately with placeholder data
        return MealResponse(
            id = id, status = "pending", name = request.description, description = "",
            calories = null, protein = null, carbs = null, fat = null,
            restaurant = null, recipeName = null, recipeUrl = null, sourceConfidence = null,
            ingredients = emptyList(), allergens = emptyList(),
            location = request.location, imageUrl = "/meals/$id/image",
            createdAt = java.time.Instant.now().toString(),
        )
    }

    fun listRecent(userId: Long, limit: Int = 20): List<MealResponse> {
        val profile = ProfileService.get(userId)
        return transaction {
            Meals.selectAll()
                .where { Meals.userId eq userId }
                .orderBy(Meals.createdAt, SortOrder.DESC)
                .limit(limit)
                .map { rowToResponse(it, profile.diet) }
        }
    }

    private fun rowToResponse(row: ResultRow, diet: String = "none"): MealResponse {
        val ingredients = runCatching {
            Json.decodeFromString(stringListSerializer, row[Meals.ingredients])
        }.getOrDefault(emptyList())

        val location =
            if (row[Meals.locationLabel] != null || row[Meals.latitude] != null || row[Meals.longitude] != null) {
                MealLocation(label = row[Meals.locationLabel], latitude = row[Meals.latitude], longitude = row[Meals.longitude])
            } else null

        val raw = row[Meals.description]
        val name = raw.substringBefore("\n").trim()
        val desc = raw.substringAfter("\n", "").trim()

        return MealResponse(
            id = row[Meals.id], status = row[Meals.status], name = name, description = desc,
            calories = row[Meals.calories], protein = row[Meals.protein],
            carbs = row[Meals.carbs], fat = row[Meals.fat],
            restaurant = row[Meals.restaurant], recipeName = row[Meals.recipeName],
            recipeUrl = row[Meals.recipeUrl], sourceConfidence = row[Meals.sourceConfidence],
            ingredients = ingredients,
            allergens = runCatching { Json.decodeFromString(stringListSerializer, row[Meals.allergens]) }.getOrDefault(emptyList()),
            dietViolations = DietChecker.check(diet, ingredients),
            alternative = row[Meals.alternative],
            location = location, imageUrl = "/meals/${row[Meals.id]}/image",
            createdAt = row[Meals.createdAt].toString(),
        )
    }

    private fun decodeImage(raw: String): ByteArray {
        val stripped = raw.substringAfter("base64,", raw)
        val cleaned = stripped.replace("\\s".toRegex(), "")
        return try {
            Base64.getDecoder().decode(cleaned)
        } catch (_: IllegalArgumentException) {
            throw InvalidImageException("Image must be base64-encoded")
        }
    }

    private fun sha256Hex(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(bytes)
        return digest.joinToString("") { "%02x".format(it) }
    }
}
