package com.allerlens.auth

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(val email: String, val password: String)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class AuthResponse(val id: Long, val email: String, val token: String)

@Serializable
data class ErrorResponse(val error: String)
