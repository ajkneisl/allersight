package com.allerlens.auth

import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

private val EMAIL_REGEX = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")

fun Route.authRoutes(jwt: JwtConfig) {
    route("/auth") {
        post("/register") {
            val body = call.receive<RegisterRequest>()
            val email = body.email.trim()

            when {
                !EMAIL_REGEX.matches(email) -> {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid email"))
                    return@post
                }
                body.password.length < 8 -> {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse("Password must be at least 8 characters")
                    )
                    return@post
                }
            }

            val user = UserService.register(email, body.password)
            val token = jwt.issueToken(user.id, user.email)
            call.respond(HttpStatusCode.Created, AuthResponse(user.id, user.email, token))
        }

        post("/login") {
            val body = call.receive<LoginRequest>()
            val user = UserService.login(body.email, body.password)
            val token = jwt.issueToken(user.id, user.email)
            call.respond(AuthResponse(user.id, user.email, token))
        }

        authenticate("auth-jwt") {
            get("/me") {
                val principal = call.principal<JWTPrincipal>()!!
                val userId = principal.subject!!.toLong()
                val email = principal.payload.getClaim("email").asString()
                call.respond(AuthResponse(userId, email, ""))
            }
        }
    }
}
