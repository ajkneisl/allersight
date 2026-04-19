package com.allerlens.meals

import com.allerlens.auth.ErrorResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

fun Route.mealRoutes(service: MealService) {
    // Public — image serving
    get("/meals/{id}/image") {
        val mealId = call.parameters["id"]!!.toLong()
        val bytes = service.getImageBytes(mealId)
        if (bytes == null) {
            call.respond(HttpStatusCode.NotFound)
            return@get
        }
        call.respondBytes(bytes, ContentType.Image.JPEG)
    }

    authenticate("auth-jwt") {
        route("/meals") {
            post {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                val body = call.receive<CreateMealRequest>()

                if (body.image.isBlank()) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("image is required"))
                    return@post
                }

                val meal = service.createMeal(userId, body)
                call.respond(HttpStatusCode.Created, meal)
            }

            get {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                call.respond(service.listRecent(userId))
            }
        }
    }
}
