package com.allerlens.vision

import com.allerlens.auth.JwtConfig
import io.ktor.server.routing.Route
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close

fun Route.visionRoutes(jwt: JwtConfig) {
    webSocket("/ws/vision") {
        val token = call.request.queryParameters["token"]
        val userId = token?.let { jwt.extractUserId(it) }
        if (userId == null) { close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "auth")); return@webSocket }

        VisionHub.addVision(userId, this)
        try {
            for (frame in incoming) { /* keep-alive */ }
        } finally {
            VisionHub.removeVision(userId, this)
        }
    }

    webSocket("/ws/status") {
        val token = call.request.queryParameters["token"]
        val userId = token?.let { jwt.extractUserId(it) }
        if (userId == null) { close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "auth")); return@webSocket }

        send(Frame.Text(if (VisionHub.isConnected(userId)) "connected" else "disconnected"))

        VisionHub.addStatus(userId, this)
        try {
            for (frame in incoming) { /* keep-alive */ }
        } finally {
            VisionHub.removeStatus(userId, this)
        }
    }

    webSocket("/ws/meals") {
        val token = call.request.queryParameters["token"]
        val userId = token?.let { jwt.extractUserId(it) }
        if (userId == null) { close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "auth")); return@webSocket }

        VisionHub.addMealListener(userId, this)
        try {
            for (frame in incoming) { /* keep-alive */ }
        } finally {
            VisionHub.removeMealListener(userId, this)
        }
    }
}
