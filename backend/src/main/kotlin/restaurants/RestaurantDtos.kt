package com.allerlens.restaurants

import kotlinx.serialization.Serializable

@Serializable
data class RestaurantResponse(
    val id: Long,
    val placeId: String,
    val name: String,
    val lat: Double,
    val lng: Double,
    val certified: Boolean,
    val allergenScore: Int?,
    val analyzed: Boolean,
)

@Serializable
data class MenuDish(
    val name: String,
    val allergens: List<String> = emptyList(),
)

@Serializable
data class RestaurantDetailResponse(
    val id: Long,
    val placeId: String,
    val name: String,
    val lat: Double,
    val lng: Double,
    val certified: Boolean,
    val allergenScore: Int?,
    val analyzed: Boolean,
    val dishes: List<MenuDish> = emptyList(),
)

@Serializable
data class AnalyzeRequest(
    val placeId: String,
    val name: String,
    val lat: Double,
    val lng: Double,
)
