package com.allerlens.friends

import kotlinx.serialization.Serializable

@Serializable
data class FriendResponse(
    val id: Long,
    val userId: Long,
    val name: String,
    val email: String,
    val allergens: List<String>,
    val diet: String,
    val sharedAllergens: Int,
)

@Serializable
data class FriendRequestResponse(
    val id: Long,
    val fromUserId: Long,
    val fromEmail: String,
    val fromName: String,
    val status: String,
    val createdAt: String,
)

@Serializable
data class AddFriendRequest(val email: String)
