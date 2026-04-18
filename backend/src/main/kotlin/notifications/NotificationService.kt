package com.allerlens.notifications

import com.allerlens.db.Notifications
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

@Serializable
data class NotificationResponse(
    val id: Long,
    val type: String,
    val title: String,
    val body: String,
    val read: Boolean,
    val createdAt: String,
)

object NotificationService {

    fun list(userId: Long): List<NotificationResponse> = transaction {
        Notifications.selectAll()
            .where { Notifications.userId eq userId }
            .orderBy(Notifications.createdAt, SortOrder.DESC)
            .limit(50)
            .map {
                NotificationResponse(
                    id = it[Notifications.id],
                    type = it[Notifications.type],
                    title = it[Notifications.title],
                    body = it[Notifications.body],
                    read = it[Notifications.read],
                    createdAt = it[Notifications.createdAt].toString(),
                )
            }
    }

    fun markRead(userId: Long, notifId: Long) = transaction {
        Notifications.update({ (Notifications.id eq notifId) and (Notifications.userId eq userId) }) {
            it[read] = true
        }
    }

    fun create(userId: Long, type: String, title: String, body: String) = transaction {
        Notifications.insert {
            it[Notifications.userId] = userId
            it[Notifications.type] = type
            it[Notifications.title] = title
            it[Notifications.body] = body
        }
    }
}
