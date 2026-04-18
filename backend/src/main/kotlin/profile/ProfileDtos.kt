package com.allerlens.profile

import kotlinx.serialization.Serializable

@Serializable
data class ProfileResponse(
    val name: String,
    val email: String,
    val allergens: List<String>,
    val diet: String,
    val calorieGoal: Int,
    val proteinGoal: Int,
    val carbsGoal: Int,
    val fatGoal: Int,
)

@Serializable
data class UpdateProfileRequest(
    val name: String? = null,
    val allergens: List<String>? = null,
    val diet: String? = null,
    val calorieGoal: Int? = null,
    val proteinGoal: Int? = null,
    val carbsGoal: Int? = null,
    val fatGoal: Int? = null,
)
