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
| `enum` (string)      | `EnumType: String` | `EnumType : String`       | String-literal members only                                   |
| `enum` (number)      | `EnumType: Int`    | `EnumType : Int`          | Numeric members only; auto-increment supported                |
| `"a" \| "b"` (string literal union) | `SynthesizedEnum: String` | `SynthesizedEnum : String` | Inline string unions synthesize new enum types |
| `1 \| 2 \| 3` (numeric literal union) | `SynthesizedEnum: Int` | `SynthesizedEnum : Int` | Inline numeric unions synthesize new enum types |
| `T \| null \| undefined` | `T?`               | `T?`                      | Null/undefined unions become optional types                   |
| `Uint8Array`         | `Data`             | `ByteArray`               | Binary data representation                                   |
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
- **Enums (supported kinds)**: Pure string enums (all members use string literal initializers) and pure numeric enums (all members numeric). Heterogeneous enums (mixing string and numeric members) are not supported and will throw an error during generation.
- **Union Types**: 
  - **String literal unions** (e.g., `"pending" | "active"`) synthesize new enum types with content-based naming (e.g., `Pending_Active_Union`)
  - **Numeric literal unions** (e.g., `1 | 2 | 3`) synthesize new enum types with underscore case names (e.g., `1_2_3_NumericUnion` with cases `_1`, `_2`, `_3`)
  - **Null/undefined unions** (e.g., `string | null`) become optional types (`String?`)
  - **Type aliases** for unions use the alias name directly (e.g., `type Status = "pending" | "active"` generates enum `Status`)
- **Nested Records**: Must conform to Record protocol/interface

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
  
  // Union types
  priority: "low" | "medium" | "high";
  level: 1 | 2 | 3;
  description: string | null;
  
  // Optional types
  description?: string;
  
  // Binary data
  imageData: Uint8Array;
  
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
  
  // Union types
  @Field
  var priority: Low_Medium_High_Union = .low
  
  @Field
  var level: 1_2_3_NumericUnion = ._1
  
  @Field
  var description: String? = nil
  
  // Optional types
  @Field
  var description: String? = nil
  
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

// Synthesized enums from literal unions
enum Low_Medium_High_Union: String, Enumerable {
  case low = "low"
  case medium = "medium"
  case high = "high"
}

enum 1_2_3_NumericUnion: Int, Enumerable {
  case _1 = 1
  case _2 = 2
  case _3 = 3
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
  
  // Union types
  @Field
  val priority: Low_Medium_High_Union = Low_Medium_High_Union.LOW
  
  @Field
  val level: 1_2_3_NumericUnion = 1_2_3_NumericUnion._1
  
  @Field
  val description: String? = null
  
  // Optional types
  @Field
  val description: String? = null
  
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

// Synthesized enums from literal unions
enum class Low_Medium_High_Union(val value: String) : Enumerable {
  LOW("low"),
  MEDIUM("medium"),
  HIGH("high")
}

enum class 1_2_3_NumericUnion(val value: Int) : Enumerable {
  _1(1),
  _2(2),
  _3(3)
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


