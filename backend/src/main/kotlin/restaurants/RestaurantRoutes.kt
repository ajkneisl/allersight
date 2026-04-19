package com.allerlens.restaurants

import com.allerlens.db.UserProfiles
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

fun Route.restaurantRoutes(service: RestaurantService) {
    authenticate("auth-jwt") {
        route("/restaurants") {
            get("/nearby") {
                val lat = call.parameters["lat"]?.toDoubleOrNull() ?: return@get call.respond(
                    io.ktor.http.HttpStatusCode.BadRequest, mapOf("error" to "lat required")
                )
                val lng = call.parameters["lng"]?.toDoubleOrNull() ?: return@get call.respond(
                    io.ktor.http.HttpStatusCode.BadRequest, mapOf("error" to "lng required")
                )
                call.respond(service.nearby(lat, lng))
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(
                    io.ktor.http.HttpStatusCode.BadRequest, mapOf("error" to "invalid id")
                )
                val detail = service.getDetail(id) ?: return@get call.respond(
                    io.ktor.http.HttpStatusCode.NotFound, mapOf("error" to "not found")
                )
                call.respond(detail)
            }

            post("/analyze") {
                val userId = call.principal<JWTPrincipal>()!!.subject!!.toLong()
                val req = call.receive<AnalyzeRequest>()
                val allergens = transaction {
                    UserProfiles.selectAll().where { UserProfiles.userId eq userId }.firstOrNull()
                        ?.let { Json.decodeFromString(ListSerializer(String.serializer()), it[UserProfiles.allergens]) }
                        ?: emptyList()
                }
                call.respond(service.analyze(req.placeId, req.name, req.lat, req.lng, allergens))
            }
        }
    }
}
