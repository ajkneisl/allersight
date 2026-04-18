package com.allerlens.notifications

import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

fun Route.notificationRoutes() {
    authenticate("auth-jwt") {
        route("/notifications") {
            get {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                call.respond(NotificationService.list(userId))
            }
            post("/{id}/read") {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                val id = call.parameters["id"]!!.toLong()
                NotificationService.markRead(userId, id)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
