import ExpoModulesCore

enum Status: String, Enumerable {
  case active = "active"
  case inactive = "inactive"
}

enum Priority: Int, Enumerable {
  case Low = 0
  case Medium = 1
  case High = 2
}

public struct Address: Record {
  @Field
  var street: String = ""

  @Field
  var city: String = ""

  @Field
  var zip: String? = nil
}

public struct UserProfile: Record {
  @Field
  var email: String = ""

  @Field
  var age: Double = 0.0
}

public struct User: Record {
  @Field
  var id: Double = 0.0

  @Field
  var name: String = ""

  @Field
  var active: Bool = false

  @Field
  var status: Status = .active

  @Field
  var priority: Priority = .Low

  @Field
  var profile: UserProfile = UserProfile()

  @Field
  var addresses: [Address] = []

  @Field
  var metadata: [String: String] = [:]

  @Field
  var attributes: [String: Any] = [:]

  @Field
  var data: Data = Data()

  @Field
  var optionalData: Data? = nil
}

public struct ValidationResult: Record {
  @Field
  var isValid: Bool = false

  @Field
  var errors: [String] = []

  @Field
  var user: User? = nil
}