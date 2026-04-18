package com.allerlens.auth

import at.favre.lib.crypto.bcrypt.BCrypt
import com.allerlens.db.Users
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

class EmailAlreadyExistsException(email: String) :
    RuntimeException("Email $email is already registered")

class InvalidCredentialsException : RuntimeException("Invalid email or password")

data class AuthenticatedUser(val id: Long, val email: String)

object UserService {
    private const val BCRYPT_COST = 12

    fun register(email: String, password: String): AuthenticatedUser {
        val normalizedEmail = email.trim().lowercase()
        val hash = BCrypt.withDefaults().hashToString(BCRYPT_COST, password.toCharArray())

        return transaction {
            val existing = Users.selectAll()
                .where { Users.email eq normalizedEmail }
                .firstOrNull()
            if (existing != null) throw EmailAlreadyExistsException(normalizedEmail)

            val id = Users.insert {
                it[Users.email] = normalizedEmail
                it[Users.passwordHash] = hash
            } get Users.id

            AuthenticatedUser(id = id, email = normalizedEmail)
        }
    }

    fun login(email: String, password: String): AuthenticatedUser {
        val normalizedEmail = email.trim().lowercase()

        return transaction {
            val row: ResultRow = Users.selectAll()
                .where { Users.email eq normalizedEmail }
                .firstOrNull() ?: throw InvalidCredentialsException()

            val result = BCrypt.verifyer()
                .verify(password.toCharArray(), row[Users.passwordHash])
            if (!result.verified) throw InvalidCredentialsException()

            AuthenticatedUser(id = row[Users.id], email = row[Users.email])
        }
    }
}
