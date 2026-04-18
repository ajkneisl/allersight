package com.allerlens.profile

import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import io.ktor.server.routing.route

fun Route.profileRoutes() {
    authenticate("auth-jwt") {
        route("/profile") {
            get {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                call.respond(ProfileService.get(userId))
            }
            put {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                val body = call.receive<UpdateProfileRequest>()
                call.respond(ProfileService.update(userId, body))
            }
        }
    }
}
