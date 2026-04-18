package com.allerlens.recipes

import kotlinx.serialization.Serializable

@Serializable
data class RecipeResponse(
    val id: Long,
    val title: String,
    val photo: String,
    val calories: Int,
    val timeMinutes: Int,
    val allergens: List<String>,
    val safeForFriends: List<Long>,
)
