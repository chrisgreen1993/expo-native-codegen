package expo.modules.testmodule

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.types.Enumerable

enum class Status(val value: String) : Enumerable {
  active("active"),
  inactive("inactive")
}

enum class Priority(val value: Int) : Enumerable {
  Low(0),
  Medium(1),
  High(2)
}

data class Address(
  @Field
  val street: String = "",

  @Field
  val city: String = "",

  @Field
  val zip: String? = null
) : Record

data class UserProfile(
  @Field
  val email: String = "",

  @Field
  val age: Double = 0.0
) : Record

data class User(
  @Field
  val id: Double = 0.0,

  @Field
  val name: String = "",

  @Field
  val active: Boolean = false,

  @Field
  val status: Status = Status.active,

  @Field
  val priority: Priority = Priority.Low,

  @Field
  val profile: UserProfile = UserProfile(),

  @Field
  val addresses: List<Address> = listOf(),

  @Field
  val metadata: Map<String, String> = mapOf(),

  @Field
  val attributes: Map<String, Any> = mapOf(),

  @Field
  val data: ByteArray = ByteArray(0),

  @Field
  val optionalData: ByteArray? = null
) : Record

data class ValidationResult(
  @Field
  val isValid: Boolean = false,

  @Field
  val errors: List<String> = listOf(),

  @Field
  val user: User? = null
) : Record