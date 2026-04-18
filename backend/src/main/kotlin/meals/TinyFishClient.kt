package com.allerlens.meals

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import org.slf4j.LoggerFactory

@Serializable
data class NutritionResult(
    val description: String = "",
    val calories: Int? = null,
    val protein: Int? = null,
    val carbs: Int? = null,
    val fat: Int? = null,
    val ingredients: List<String> = emptyList(),
)

@Serializable
data class SourceResult(
    val restaurant: String? = null,
    val recipeName: String? = null,
    val recipeUrl: String? = null,
    val confidence: String? = null,
)

@Serializable
data class MealExtraction(
    val nutrition: NutritionResult,
    val source: SourceResult,
)

class TinyFishException(message: String) : RuntimeException(message)

class TinyFishClient(
    private val baseUrl: String,
    private val apiKey: String?,
) {
    private val log = LoggerFactory.getLogger("TinyFish")
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    private val http = HttpClient(CIO) {
        install(ContentNegotiation) { json(json) }
        install(HttpTimeout) {
            requestTimeoutMillis = 120_000
            connectTimeoutMillis = 15_000
            socketTimeoutMillis = 120_000
        }
    }

    suspend fun analyzeMeal(
        imageBase64: String,
        mealDescription: String,
        locationLabel: String?,
    ): MealExtraction {
        if (apiKey.isNullOrBlank()) throw TinyFishException("TINYFISH_API_KEY is not configured")
        log.info("analyzeMeal started — description=\"{}\"", mealDescription.take(80))
        val start = System.currentTimeMillis()

        val result = coroutineScope {
            val nutritionDeferred = async { fetchNutrition(imageBase64, mealDescription) }
            val sourceDeferred = async { fetchSource(imageBase64, mealDescription, locationLabel) }
            MealExtraction(
                nutrition = nutritionDeferred.await(),
                source = sourceDeferred.await(),
            )
        }

        log.info("analyzeMeal completed — {}ms — cal={} protein={} restaurant={}",
            System.currentTimeMillis() - start,
            result.nutrition.calories, result.nutrition.protein, result.source.restaurant)
        return result
    }

    private suspend fun fetchNutrition(imageBase64: String, mealDescription: String): NutritionResult {
        val goal = buildString {
            append("I have a photo of a meal (data:image/jpeg;base64,$imageBase64). ")
            append("The detected labels are: \"$mealDescription\". ")
            append("Analyze the image and search for nutrition information. ")
            append("Extract and return JSON with keys: ")
            append("description (string, the food name), ")
            append("calories (integer, total kcal), ")
            append("protein (integer, grams), ")
            append("carbs (integer, grams), ")
            append("fat (integer, grams), ")
            append("ingredients (array of strings, main ingredients). ")
            append("Return only the JSON object.")
        }
        val result = runAgent("https://www.nutritionix.com", goal)
        return parseNutrition(result)
    }

    private suspend fun fetchSource(imageBase64: String, mealDescription: String, locationLabel: String?): SourceResult {
        val query = buildString {
            append("\"$mealDescription\"")
            if (!locationLabel.isNullOrBlank()) append(" near $locationLabel")
            append(" restaurant OR recipe")
        }
        val goal = buildString {
            append("I have a photo of a meal (data:image/jpeg;base64,$imageBase64). ")
            append("The detected labels are: \"$mealDescription\". ")
            append("Search for: $query. ")
            append("Determine if this is a restaurant dish or a home recipe. ")
            append("Return JSON with keys: ")
            append("restaurant (string or null, restaurant name if found), ")
            append("recipeName (string or null, recipe name if it's a recipe), ")
            append("recipeUrl (string or null, URL to the recipe), ")
            append("confidence (string: high, medium, or low). ")
            append("Return only the JSON object.")
        }
        val result = runAgent("https://www.google.com", goal)
        return parseSource(result)
    }

    private suspend fun runAgent(url: String, goal: String): JsonElement {
        val label = if (url.contains("nutritionix")) "nutrition" else "source"
        log.info("TinyFish {} request → {}", label, url)
        val start = System.currentTimeMillis()

        val body = buildJsonObject {
            put("url", url)
            put("goal", goal)
        }
        val response = http.post(baseUrl) {
            header("X-API-Key", apiKey)
            contentType(ContentType.Application.Json)
            setBody(body)
        }
        val elapsed = System.currentTimeMillis() - start
        val responseText = response.bodyAsText()

        if (response.status != HttpStatusCode.OK) {
            log.error("TinyFish {} failed — {} ({}ms): {}", label, response.status.value, elapsed, responseText.take(300))
            throw TinyFishException("TinyFish error ${response.status.value}: $responseText")
        }

        log.info("TinyFish {} completed — 200 ({}ms): {}", label, elapsed, responseText.take(500))
        return json.parseToJsonElement(responseText)
    }

    private fun parseNutrition(envelope: JsonElement): NutritionResult {
        val obj = findJsonObject(envelope, listOf("calories"))
            ?: return NutritionResult()
        return NutritionResult(
            description = obj.str("description") ?: "",
            calories = obj.int("calories"),
            protein = obj.int("protein"),
            carbs = obj.int("carbs"),
            fat = obj.int("fat"),
            ingredients = obj["ingredients"]?.jsonArray
                ?.mapNotNull { it.jsonPrimitive.contentOrNull() } ?: emptyList(),
        )
    }

    private fun parseSource(envelope: JsonElement): SourceResult {
        val obj = findJsonObject(envelope, listOf("restaurant", "recipeName", "recipeUrl"))
            ?: return SourceResult()
        return SourceResult(
            restaurant = obj.str("restaurant"),
            recipeName = obj.str("recipeName"),
            recipeUrl = obj.str("recipeUrl"),
            confidence = obj.str("confidence"),
        )
    }

    private fun findJsonObject(element: JsonElement, markers: List<String>): JsonObject? {
        // First try to get the "result" field from the TinyFish run response
        val root = when (element) {
            is JsonObject -> element["result"]?.let { if (it is JsonObject) it else element } ?: element
            else -> element
        }

        val queue = mutableListOf<JsonElement>(root)
        val seen = mutableSetOf<JsonElement>()
        while (queue.isNotEmpty()) {
            val current = queue.removeAt(0)
            if (!seen.add(current)) continue
            when (current) {
                is JsonObject -> {
                    if (markers.any { current.containsKey(it) }) return current
                    queue += current.values
                }
                is kotlinx.serialization.json.JsonArray -> queue.addAll(current)
                else -> {
                    val text = runCatching { current.jsonPrimitive.content }.getOrNull()
                    if (text != null && text.trimStart().startsWith("{")) {
                        runCatching { json.parseToJsonElement(text) }.getOrNull()?.let { queue += it }
                    }
                }
            }
        }
        return null
    }

    private fun JsonObject.str(key: String): String? {
        val v = this[key]?.jsonPrimitive?.contentOrNull() ?: return null
        return if (v.isBlank() || v == "null") null else v
    }

    private fun JsonObject.int(key: String): Int? =
        this[key]?.jsonPrimitive?.contentOrNull()?.toIntOrNull()

    private fun kotlinx.serialization.json.JsonPrimitive.contentOrNull(): String? {
        if (this.toString() == "null") return null
        return this.content.ifBlank { null }
    }
}
