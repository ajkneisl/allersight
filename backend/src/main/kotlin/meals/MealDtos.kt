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
    val description: String,
    val mimeType: String = "image/jpeg",
    val location: MealLocation? = null,
)

@Serializable
data class MealResponse(
    val id: Long,
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
    val location: MealLocation?,
    val imageUrl: String?,
    val createdAt: String,
)
