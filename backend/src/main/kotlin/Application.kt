package com.allerlens

import com.allerlens.auth.EmailAlreadyExistsException
import com.allerlens.auth.ErrorResponse
import com.allerlens.auth.InvalidCredentialsException
import com.allerlens.auth.JwtConfig
import com.allerlens.auth.authRoutes
import com.allerlens.db.DatabaseFactory
import com.allerlens.friends.AlreadyFriendsException
import com.allerlens.friends.FriendNotFoundException
import com.allerlens.friends.friendRoutes
import com.allerlens.notifications.notificationRoutes
import com.allerlens.meals.DuplicateMealException
import com.allerlens.meals.FeatherlessClient
import com.allerlens.meals.InvalidImageException
import com.allerlens.meals.MealService
import com.allerlens.meals.TinyFishClient
import com.allerlens.meals.TinyFishException
import com.allerlens.meals.mealRoutes
import com.allerlens.profile.profileRoutes
import com.allerlens.recipes.recipeRoutes
import com.allerlens.restaurants.RestaurantService
import com.allerlens.restaurants.RestaurantCrawler
import com.allerlens.restaurants.restaurantRoutes
import com.allerlens.vision.visionRoutes
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.*
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt
import io.ktor.server.http.content.singlePageApplication
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import io.ktor.server.routing.routing

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.io.File

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

private fun loadDotenv(): Map<String, String> {
    val candidates = listOf(File(".env"), File("backend/.env"))
    val file = candidates.firstOrNull { it.exists() } ?: return emptyMap()
    return file.readLines()
        .filter { it.contains('=') && !it.trimStart().startsWith('#') }
        .associate { line ->
            val (k, v) = line.split('=', limit = 2)
            k.trim() to v.trim()
        }
}

fun Application.module() {
    val dotenv = loadDotenv()
    fun env(key: String): String? = System.getenv(key) ?: dotenv[key]

    DatabaseFactory.init(this)

    // Seed test business accounts
    for (email in listOf("user@example.com", "yord@allersight.com")) {
        try { com.allerlens.auth.UserService.register(email, "password") }
        catch (_: com.allerlens.auth.EmailAlreadyExistsException) { /* already seeded */ }
    }

    val jwt = JwtConfig.fromApplication(this, env("JWT_SECRET"))

    val tinyFishBaseUrl = env("TINYFISH_BASE_URL")
        ?: environment.config.property("tinyfish.baseUrl").getString()
    val tinyFishClient = TinyFishClient(
        baseUrl = tinyFishBaseUrl,
        apiKey = env("TINYFISH_API_KEY"),
    )
    val featherlessClient = FeatherlessClient(apiKey = env("FEATHERLESS_API_KEY"))
    val mealService = MealService(featherlessClient, tinyFishClient, CoroutineScope(SupervisorJob() + Dispatchers.IO))
    val restaurantService = RestaurantService(tinyFishClient)
    val crawlerScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    RestaurantCrawler(tinyFishClient, crawlerScope).start()

    install(ContentNegotiation) { json() }

    intercept(ApplicationCallPipeline.Monitoring) {
        val start = System.currentTimeMillis()
        proceed()
        val ms = System.currentTimeMillis() - start
        val method = call.request.local.method.value
        val path = call.request.local.uri
        val status = call.response.status()
        if ("/ws/" !in path) {
            application.log.info("{} {} → {} ({}ms)", method, path, status, ms)
        }
    }

    install(io.ktor.server.websocket.WebSockets)

    install(Authentication) {
        jwt("auth-jwt") {
            realm = jwt.realm
            verifier(jwt.verifier)
            validate { credential ->
                if (credential.payload.subject.isNullOrBlank()) null
                else JWTPrincipal(credential.payload)
            }
        }
    }

    install(StatusPages) {
        exception<EmailAlreadyExistsException> { call, cause ->
            call.respond(HttpStatusCode.Conflict, ErrorResponse(cause.message ?: "Email exists"))
        }
        exception<InvalidCredentialsException> { call, _ ->
            call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Invalid email or password"))
        }
        exception<DuplicateMealException> { call, cause ->
            call.respond(HttpStatusCode.Conflict, ErrorResponse(cause.message ?: "Duplicate meal"))
        }
        exception<FriendNotFoundException> { call, cause ->
            call.respond(HttpStatusCode.NotFound, ErrorResponse(cause.message ?: "Not found"))
        }
        exception<AlreadyFriendsException> { call, cause ->
            call.respond(HttpStatusCode.Conflict, ErrorResponse(cause.message ?: "Already friends"))
        }
        exception<InvalidImageException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(cause.message ?: "Invalid image"))
        }
        exception<TinyFishException> { call, cause ->
            call.application.log.error("TinyFish call failed", cause)
            call.respond(HttpStatusCode.BadGateway, ErrorResponse(cause.message ?: "AI service error"))
        }
        exception<BadRequestException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(cause.message ?: "Bad request"))
        }
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled error", cause)
            call.respond(HttpStatusCode.InternalServerError, ErrorResponse("Internal error"))
        }
    }

    routing {
        route("/api") {
            get("/test") {
                call.respondText("hello")
            }

            authRoutes(jwt)
            mealRoutes(mealService)
            profileRoutes()
            friendRoutes()
            notificationRoutes()
            recipeRoutes()
            restaurantRoutes(restaurantService)
        }
        visionRoutes(jwt)
        singlePageApplication {
            useResources = true
            filesPath = "static"
        }
    }
}
