package com.allerlens.recipes

import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.recipeRoutes() {
    authenticate("auth-jwt") {
        route("/recipes") {
            get {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                call.respond(RecipeService.list(userId))
            }
        }
    }
}
