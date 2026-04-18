package com.allerlens.friends

import com.allerlens.db.FriendRequests
import com.allerlens.db.Friends
import com.allerlens.db.UserProfiles
import com.allerlens.db.Users
import com.allerlens.notifications.NotificationService
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

class FriendNotFoundException : RuntimeException("User not found")
class AlreadyFriendsException : RuntimeException("Already friends or request pending")

private val stringList = ListSerializer(String.serializer())

object FriendService {

    private fun parseAllergens(raw: String): List<String> =
        runCatching { Json.decodeFromString(stringList, raw) }.getOrDefault(emptyList())

    private fun myAllergens(userId: Long): List<String> {
        val row = UserProfiles.selectAll().where { UserProfiles.userId eq userId }.firstOrNull()
        return row?.let { parseAllergens(it[UserProfiles.allergens]) } ?: emptyList()
    }

    private fun userName(userId: Long): String {
        val profile = UserProfiles.selectAll().where { UserProfiles.userId eq userId }.firstOrNull()
        val email = Users.selectAll().where { Users.id eq userId }.first()[Users.email]
        return profile?.get(UserProfiles.name)?.ifBlank { email } ?: email
    }

    fun list(userId: Long): List<FriendResponse> = transaction {
        val mine = myAllergens(userId)
        Friends.selectAll().where { Friends.userId eq userId }.map { row ->
            val fid = row[Friends.friendUserId]
            val user = Users.selectAll().where { Users.id eq fid }.first()
            val profile = UserProfiles.selectAll().where { UserProfiles.userId eq fid }.firstOrNull()
            val theirAllergens = profile?.let { parseAllergens(it[UserProfiles.allergens]) } ?: emptyList()
            FriendResponse(
                id = row[Friends.id], userId = fid,
                name = profile?.get(UserProfiles.name)?.ifBlank { user[Users.email] } ?: user[Users.email],
                email = user[Users.email], allergens = theirAllergens,
                diet = profile?.get(UserProfiles.diet) ?: "none",
                sharedAllergens = mine.intersect(theirAllergens.toSet()).size,
            )
        }
    }

    fun sendRequest(fromUserId: Long, toEmail: String): FriendRequestResponse = transaction {
        val toUser = Users.selectAll().where { Users.email eq toEmail.trim().lowercase() }.firstOrNull()
            ?: throw FriendNotFoundException()
        val toId = toUser[Users.id]

        // Check existing friendship or pending request
        val existingFriend = Friends.selectAll()
            .where { (Friends.userId eq fromUserId) and (Friends.friendUserId eq toId) }
            .firstOrNull()
        if (existingFriend != null) throw AlreadyFriendsException()

        val existingReq = FriendRequests.selectAll()
            .where {
                ((FriendRequests.fromUserId eq fromUserId) and (FriendRequests.toUserId eq toId)) or
                ((FriendRequests.fromUserId eq toId) and (FriendRequests.toUserId eq fromUserId))
            }
            .firstOrNull { it[FriendRequests.status] == "pending" }
        if (existingReq != null) throw AlreadyFriendsException()

        val id = FriendRequests.insert {
            it[FriendRequests.fromUserId] = fromUserId
            it[FriendRequests.toUserId] = toId
        } get FriendRequests.id

        val fromName = userName(fromUserId)
        NotificationService.create(toId, "friend_request", "Friend request", "$fromName wants to be your friend")

        FriendRequestResponse(
            id = id, fromUserId = fromUserId, fromEmail = Users.selectAll().where { Users.id eq fromUserId }.first()[Users.email],
            fromName = fromName, status = "pending",
            createdAt = java.time.Instant.now().toString(),
        )
    }

    fun pendingRequests(userId: Long): List<FriendRequestResponse> = transaction {
        FriendRequests.selectAll()
            .where { (FriendRequests.toUserId eq userId) and (FriendRequests.status eq "pending") }
            .map { row ->
                val fid = row[FriendRequests.fromUserId]
                val email = Users.selectAll().where { Users.id eq fid }.first()[Users.email]
                FriendRequestResponse(
                    id = row[FriendRequests.id], fromUserId = fid, fromEmail = email,
                    fromName = userName(fid), status = row[FriendRequests.status],
                    createdAt = row[FriendRequests.createdAt].toString(),
                )
            }
    }

    fun acceptRequest(userId: Long, requestId: Long) = transaction {
        val req = FriendRequests.selectAll()
            .where { (FriendRequests.id eq requestId) and (FriendRequests.toUserId eq userId) and (FriendRequests.status eq "pending") }
            .firstOrNull() ?: throw FriendNotFoundException()

        val fromId = req[FriendRequests.fromUserId]

        FriendRequests.update({ FriendRequests.id eq requestId }) { it[status] = "accepted" }

        // Create bidirectional friendship
        Friends.insert { it[Friends.userId] = userId; it[friendUserId] = fromId }
        Friends.insert { it[Friends.userId] = fromId; it[friendUserId] = userId }

        val accepterName = userName(userId)
        NotificationService.create(fromId, "friend_accepted", "Friend request accepted", "$accepterName accepted your friend request")
    }

    fun rejectRequest(userId: Long, requestId: Long) = transaction {
        FriendRequests.update({
            (FriendRequests.id eq requestId) and (FriendRequests.toUserId eq userId) and (FriendRequests.status eq "pending")
        }) { it[status] = "rejected" }
    }

    fun remove(userId: Long, friendId: Long) = transaction {
        val row = Friends.selectAll().where { (Friends.id eq friendId) and (Friends.userId eq userId) }.firstOrNull()
        if (row != null) {
            val otherId = row[Friends.friendUserId]
            Friends.deleteWhere { (Friends.userId eq userId) and (Friends.friendUserId eq otherId) }
            Friends.deleteWhere { (Friends.userId eq otherId) and (Friends.friendUserId eq userId) }
        }
    }
}
