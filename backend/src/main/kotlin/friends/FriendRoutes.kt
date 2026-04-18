package com.allerlens.friends

import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

fun Route.friendRoutes() {
    authenticate("auth-jwt") {
        route("/friends") {
            get { call.respond(FriendService.list(call.principal<JWTPrincipal>()!!.subject!!.toLong())) }

            delete("/{id}") {
                FriendService.remove(call.principal<JWTPrincipal>()!!.subject!!.toLong(), call.parameters["id"]!!.toLong())
                call.respond(HttpStatusCode.NoContent)
            }

            // Friend requests
            post("/request") {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                val body = call.receive<AddFriendRequest>()
                call.respond(HttpStatusCode.Created, FriendService.sendRequest(userId, body.email))
            }

            get("/requests") {
                call.respond(FriendService.pendingRequests(call.principal<JWTPrincipal>()!!.subject!!.toLong()))
            }

            post("/requests/{id}/accept") {
                FriendService.acceptRequest(call.principal<JWTPrincipal>()!!.subject!!.toLong(), call.parameters["id"]!!.toLong())
                call.respond(HttpStatusCode.NoContent)
            }

            post("/requests/{id}/reject") {
                FriendService.rejectRequest(call.principal<JWTPrincipal>()!!.subject!!.toLong(), call.parameters["id"]!!.toLong())
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
