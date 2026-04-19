package com.allerlens.meals

import kotlinx.serialization.Serializable

@Serializable
data class MealLocation(
    val label: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
)

@Serializable
data class CreateMealRequest(
    val image: String,
    val description: String = "food",
    val mimeType: String = "image/jpeg",
    val location: MealLocation? = null,
    val friendIds: List<Long> = emptyList(),
)

@Serializable
data class MealResponse(
    val id: Long,
    val status: String = "pending", // pending, ready, error
    val name: String,
    val description: String,
    val calories: Int?,
    val protein: Int?,
    val carbs: Int?,
    val fat: Int?,
    val restaurant: String?,
    val recipeName: String?,
    val recipeUrl: String?,
    val sourceConfidence: String?,
    val ingredients: List<String>,
    val allergens: List<String> = emptyList(),
    val dietViolations: List<String> = emptyList(),
    val alternative: String? = null,
    val location: MealLocation?,
    val imageUrl: String?,
    val createdAt: String,
)
