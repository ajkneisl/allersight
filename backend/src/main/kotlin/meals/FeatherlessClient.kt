package com.allerlens.meals

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

@Serializable
data class FeatherlessResult(
    val name: String,
    val description: String,
    val calories: Int? = null,
    val protein: Int? = null,
    val carbs: Int? = null,
    val fat: Int? = null,
    val allergens: List<String> = emptyList(),
    val ingredients: List<String> = emptyList(),
)

class NoFoodDetectedException : RuntimeException("No food detected in image")

class FeatherlessClient(private val apiKey: String?) {

    private val log = LoggerFactory.getLogger("featherless")
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    private val http = HttpClient(CIO) {
        install(ContentNegotiation) { json(json) }
        install(HttpTimeout) {
            requestTimeoutMillis = 120_000
            connectTimeoutMillis = 15_000
            socketTimeoutMillis = 120_000
        }
    }

    suspend fun analyzeImage(imageBase64: String, mimeType: String): FeatherlessResult {
        if (apiKey.isNullOrBlank()) throw RuntimeException("FEATHERLESS_API_KEY not configured")

        val dataUrl = "data:$mimeType;base64,$imageBase64"

        val prompt = buildString {
            append("Analyze this food image. Return ONLY a JSON object with these keys: ")
            append("name (string, the specific dish or food name), ")
            append("description (string, a detailed description including the food category/type e.g. fruit, grain, seafood, dessert, etc., what it looks like, and how it might be prepared), ")
            append("calories (integer, estimated total kcal), ")
            append("protein (integer, grams), ")
            append("carbs (integer, grams), ")
            append("fat (integer, grams), ")
            append("allergens (array of strings from: peanuts, tree-nuts, dairy, eggs, gluten, soy, shellfish, fish, sesame — infer allergens from ingredients even if not directly visible, e.g. pizza dough contains gluten, cheese contains dairy, soy sauce contains soy and gluten, bread contains gluten, butter/cream contain dairy, mayo contains eggs), ")
            append("ingredients (array of strings, main visible ingredients). ")
            append("Return ONLY the JSON, no markdown, no explanation.")
        }

        log.info("Sending request — prompt: {}", prompt)

        val models = listOf(
            "google/gemma-4-31B-it",
            "google/gemma-3-12b-it",
            "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
            "mistralai/Mistral-Small-3.1-24B-Instruct-2503",
        )

        var lastError: String? = null
        for (model in models) {
            val requestBody = buildJsonObject {
                put("model", model)
                put("messages", buildJsonArray {
                    add(buildJsonObject {
                        put("role", "user")
                        put("content", buildJsonArray {
                            add(buildJsonObject {
                                put("type", "image_url")
                                put("image_url", buildJsonObject { put("url", dataUrl) })
                            })
                            add(buildJsonObject { put("type", "text"); put("text", prompt) })
                        })
                    })
                })
            }

            log.info("Trying model: {}", model)

            val response: JsonElement = http.post("https://api.featherless.ai/v1/chat/completions") {
                header("Authorization", "Bearer $apiKey")
                contentType(ContentType.Application.Json)
                setBody(requestBody)
            }.body()

            val error = response.jsonObject["error"]
            if (error != null) {
                lastError = error.toString()
                log.warn("Model {} failed: {}", model, lastError)
                continue
            }

            log.info("Raw response from {}: {}", model, response)

            val content = response.jsonObject["choices"]
                ?.jsonArray?.getOrNull(0)
                ?.jsonObject?.get("message")
                ?.jsonObject?.get("content")
                ?.jsonPrimitive?.content
                ?: throw RuntimeException("Unexpected response from $model: $response")

            log.info("Response content: {}", content)
            return parseResult(content)
        }

        throw RuntimeException("All models failed. Last error: $lastError")
    }

    private fun parseResult(raw: String): FeatherlessResult {
        val cleaned = raw.replace(Regex("```json\\s*"), "").replace(Regex("```\\s*"), "").trim()
        // Detect refusal / no food responses
        if (!cleaned.startsWith("{")) {
            throw NoFoodDetectedException()
        }
        val obj = json.parseToJsonElement(cleaned).jsonObject
        val name = obj["name"]?.jsonPrimitive?.content ?: "Unknown"
        if (name.equals("none", ignoreCase = true) || name.equals("unknown", ignoreCase = true)) {
            throw NoFoodDetectedException()
        }
        return FeatherlessResult(
            name = name,
            description = obj["description"]?.jsonPrimitive?.content ?: "",
            calories = obj["calories"]?.jsonPrimitive?.content?.toIntOrNull(),
            protein = obj["protein"]?.jsonPrimitive?.content?.toIntOrNull(),
            carbs = obj["carbs"]?.jsonPrimitive?.content?.toIntOrNull(),
            fat = obj["fat"]?.jsonPrimitive?.content?.toIntOrNull(),
            allergens = obj["allergens"]?.jsonArray?.mapNotNull { it.jsonPrimitive.content } ?: emptyList(),
            ingredients = obj["ingredients"]?.jsonArray?.mapNotNull { it.jsonPrimitive.content } ?: emptyList(),
        )
    }
}
