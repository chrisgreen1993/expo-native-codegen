# TypeScript to Swift/Kotlin Type Mapping for Expo Records

This document defines the mapping between TypeScript types and their corresponding Swift and Kotlin types for Expo Records, based on actual supported types.

## Supported Types

| TypeScript Type      | Swift Type         | Kotlin Type              | Notes                                                         |
|----------------------|--------------------|--------------------------|---------------------------------------------------------------|
| `string`             | `String`           | `String`                 | UTF-8 string                                                  |
| `number`             | `Double` / `Int`   | `Double` / `Int` / `Float` | Use `Int`/`Int64` for integers, `Double`/`Float` for floats  |
| `boolean`            | `Bool`             | `Boolean`                | True/false value                                              |
| `any`                | `Any`              | `Any`                    | Generic/unknown type (use with caution)                      |
| `string[]`           | `[String]`         | `List<String>`            | Array of strings                                              |
| `number[]`           | `[Int]` / `[Double]` | `List<Int>` / `List<Double>` | Array of numbers                                              |
| `boolean[]`          | `[Bool]`           | `List<Boolean>`           | Array of booleans                                             |
| `T[]` (nested records) | `[RecordType]`     | `List<RecordType>`        | Array of nested record types                                  |
| `object` (dictionary) | `[String: Any]`    | `Map<String, Any>`        | Only serializable types supported                             |
| `Record<string, T>`  | `[String: T]`      | `Map<String, T>`          | Typed map with specific value type                            |
| `enum` (string)      | `EnumType: String` | `EnumType : String`       | Use Swift/Kotlin enum types                                   |
| `null` / `undefined` | `T?`               | `T?`                      | Use optional types                                            |
| `Date` (ISO string)  | `String`           | `String`                  | Generally represented as ISO 8601 string                      |
| `UInt8Array`         | `Data`             | `ByteArray`               | Binary data representation                                   |
| Nested Record        | `RecordType`       | `RecordType`              | Must conform to Record protocol/interface                     |

## Type Modifiers

| TypeScript Modifier | Swift Result | Kotlin Result | Notes |
|---------------------|--------------|---------------|-------|
| `T`                 | `T`          | `T`           | Required type |
| `T?`                | `T?`         | `T?`          | Optional type (any type can be optional) |

## Notes

- **Swift**: Uses `Int`/`Int64` for integers, `Double` for floating point
- **Kotlin**: Uses `Int`/`Long` for integers, `Double`/`Float` for floating point
- **Arrays**: Swift uses `[T]` syntax, Kotlin uses `List<T>` syntax
- **Maps**: Swift uses `[String: T]` syntax, Kotlin uses `Map<String, T>` syntax
- **Enums**: Must conform to `Enumerable` interface in both Swift and Kotlin
- **Nested Records**: Must conform to Record protocol/interface
- **Date handling**: Typically converted to ISO 8601 strings for cross-platform compatibility

## Example Usage in Expo Records

### TypeScript Interface (Input)

```typescript
// TypeScript interface that maps to the generated Records
export interface ExampleRecord {
  // Primitive types
  name: string;
  age: number;
  height: number;
  isActive: boolean;
  
  // Generic type
  genericData: any;
  
  // Array types
  tags: string[];
  scores: number[];
  flags: boolean[];
  
  // Nested array types
  addresses: Address[];
  
  // Map/Object types
  metadata: Record<string, string>;
  config: Record<string, any>;
  
  // Enum type
  status: Status;
  
  // Optional types
  description?: string;
  lastLogin?: string; // ISO 8601 date string
  
  // Date as ISO string
  createdAt: string; // ISO 8601 date string
  
  // Binary data
  imageData: UInt8Array;
  
  // Nested Record
  address: Address;
}

// Enum values
export enum Status {
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive"
}

// Nested interface
export interface Address {
  street: string;
  city: string;
  zipCode: string;
}
```

### Generated Swift Record (Output)

```swift
// Swift - Comprehensive example showing all supported types
public struct ExampleRecord: Record {
  // Primitive types
  @Field
  var name: String = ""
  
  @Field
  var age: Int = 0
  
  @Field
  var height: Double = 0.0
  
  @Field
  var isActive: Bool = false
  
  // Generic type
  @Field
  var genericData: Any = [:]
  
  // Array types
  @Field
  var tags: [String] = []
  
  @Field
  var scores: [Int] = []
  
  @Field
  var flags: [Bool] = []
  
  // Nested array types
  @Field
  var addresses: [Address] = []
  
  // Map/Object types
  @Field
  var metadata: [String: String] = [:]
  
  @Field
  var config: [String: Any] = [:]
  
  // Enum type
  @Field
  var status: Status = .pending
  
  // Optional types
  @Field
  var description: String? = nil
  
  @Field
  var lastLogin: String? = nil // ISO 8601 date string
  
  // Date as ISO string
  @Field
  var createdAt: String = "" // ISO 8601 date string
  
  // Binary data
  @Field
  var imageData: Data = Data()
  
  // Nested Record
  @Field
  var address: Address = Address()
}

// Enum must conform to Enumerable
enum Status: String, Enumerable {
  case pending = "pending"
  case active = "active"
  case inactive = "inactive"
}

// Nested Record must conform to Record protocol
public struct Address: Record {
  @Field
  var street: String = ""
  
  @Field
  var city: String = ""
  
  @Field
  var zipCode: String = ""
}
```

### Generated Kotlin Record (Output)

```kotlin
// Kotlin - Comprehensive example showing all supported types
class ExampleRecord : Record {
  // Primitive types
  @Field
  val name: String = ""
  
  @Field
  val age: Int = 0
  
  @Field
  val height: Double = 0.0
  
  @Field
  val isActive: Boolean = false
  
  // Generic type
  @Field
  val genericData: Any = mapOf()
  
  // Array types
  @Field
  val tags: List<String> = listOf()
  
  @Field
  val scores: List<Int> = listOf()
  
  @Field
  val flags: List<Boolean> = listOf()
  
  // Nested array types
  @Field
  val addresses: List<Address> = listOf()
  
  // Map/Object types
  @Field
  val metadata: Map<String, String> = mapOf()
  
  @Field
  val config: Map<String, Any> = mapOf()
  
  // Enum type
  @Field
  val status: Status = Status.PENDING
  
  // Optional types
  @Field
  val description: String? = null
  
  @Field
  val lastLogin: String? = null // ISO 8601 date string
  
  // Date as ISO string
  @Field
  val createdAt: String = "" // ISO 8601 date string
  
  // Binary data
  @Field
  val imageData: ByteArray = ByteArray(0)
  
  // Nested Record
  @Field
  val address: Address = Address()
}

// Enum must conform to Enumerable
enum class Status(val value: String) : Enumerable {
  PENDING("pending"),
  ACTIVE("active"),
  INACTIVE("inactive")
}

// Nested Record must conform to Record interface
class Address : Record {
  @Field
  val street: String = ""
  
  @Field
  val city: String = ""
  
  @Field
  val zipCode: String = ""
}
```


