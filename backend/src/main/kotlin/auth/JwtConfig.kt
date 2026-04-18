package com.allerlens.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.Application
import java.util.Date

data class JwtConfig(
    val secret: String,
    val issuer: String,
    val audience: String,
    val realm: String,
    val expirationSeconds: Long,
) {
    private val algorithm: Algorithm = Algorithm.HMAC256(secret)

    val verifier = JWT.require(algorithm)
        .withIssuer(issuer)
        .withAudience(audience)
        .build()

    fun issueToken(userId: Long, email: String): String {
        val now = System.currentTimeMillis()
        return JWT.create()
            .withIssuer(issuer)
            .withAudience(audience)
            .withSubject(userId.toString())
            .withClaim("email", email)
            .withIssuedAt(Date(now))
            .withExpiresAt(Date(now + expirationSeconds * 1000))
            .sign(algorithm)
    }

    fun extractUserId(token: String): Long? = try {
        verifier.verify(token).subject?.toLong()
    } catch (_: Exception) { null }

    companion object {
        fun fromApplication(app: Application, envSecret: String? = null): JwtConfig {
            val jwt = app.environment.config.config("jwt")
            val secret = envSecret ?: "dev-secret-change-me"
            return JwtConfig(
                secret = secret,
                issuer = jwt.property("issuer").getString(),
                audience = jwt.property("audience").getString(),
                realm = jwt.property("realm").getString(),
                expirationSeconds = jwt.property("expirationSeconds").getString().toLong(),
            )
        }
    }
}
