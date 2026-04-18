package com.allerlens.vision

import io.ktor.websocket.DefaultWebSocketSession
import io.ktor.websocket.Frame
import org.slf4j.LoggerFactory
import java.util.concurrent.ConcurrentHashMap

/**
 * Tracks which users have a vision client connected.
 * Vision connects to /ws/vision?token=..., app connects to /ws/status?token=...
 * When vision connects/disconnects, all status subscribers for that user are notified.
 */
object VisionHub {
    private val log = LoggerFactory.getLogger("VisionHub")
    // userId -> set of vision sessions
    private val visionSessions = ConcurrentHashMap<Long, MutableSet<DefaultWebSocketSession>>()
    // userId -> set of app status sessions
    private val statusSessions = ConcurrentHashMap<Long, MutableSet<DefaultWebSocketSession>>()
    // userId -> set of app meal-feed sessions
    private val mealSessions = ConcurrentHashMap<Long, MutableSet<DefaultWebSocketSession>>()

    fun isConnected(userId: Long): Boolean =
        visionSessions[userId]?.isNotEmpty() == true

    fun hasStatusSubscriber(userId: Long): Boolean =
        statusSessions[userId]?.isNotEmpty() == true

    suspend fun addVision(userId: Long, session: DefaultWebSocketSession) {
        visionSessions.getOrPut(userId) { ConcurrentHashMap.newKeySet() }.add(session)
        log.info("Vision connected for user {} (total: {})", userId, visionSessions[userId]?.size)
        notifyStatus(userId)
    }

    suspend fun removeVision(userId: Long, session: DefaultWebSocketSession) {
        visionSessions[userId]?.remove(session)
        log.info("Vision disconnected for user {} (total: {})", userId, visionSessions[userId]?.size ?: 0)
        notifyStatus(userId)
    }

    fun addStatus(userId: Long, session: DefaultWebSocketSession) {
        statusSessions.getOrPut(userId) { ConcurrentHashMap.newKeySet() }.add(session)
        log.info("Status subscriber added for user {} (total: {})", userId, statusSessions[userId]?.size)
    }

    fun removeStatus(userId: Long, session: DefaultWebSocketSession) {
        statusSessions[userId]?.remove(session)
        log.info("Status subscriber removed for user {} (total: {})", userId, statusSessions[userId]?.size ?: 0)
    }

    fun addMealListener(userId: Long, session: DefaultWebSocketSession) {
        mealSessions.getOrPut(userId) { ConcurrentHashMap.newKeySet() }.add(session)
    }

    fun removeMealListener(userId: Long, session: DefaultWebSocketSession) {
        mealSessions[userId]?.remove(session)
    }

    suspend fun broadcastMeal(userId: Long, json: String) {
        mealSessions[userId]?.forEach { s ->
            try { s.send(Frame.Text(json)) } catch (_: Exception) {}
        }
    }

    private suspend fun notifyStatus(userId: Long) {
        val connected = isConnected(userId)
        val msg = if (connected) "connected" else "disconnected"
        val subs = statusSessions[userId]?.size ?: 0
        log.info("Notifying {} status subscribers for user {}: {}", subs, userId, msg)
        statusSessions[userId]?.forEach { s ->
            try { s.send(Frame.Text(msg)) } catch (e: Exception) {
                log.warn("Failed to send status to subscriber: {}", e.message)
            }
        }
    }
}
