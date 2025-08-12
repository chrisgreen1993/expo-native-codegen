# Expo Record CodeGen - Project Goals

## Problem Statement
When creating Expo Native Modules, developers must manually write:
1. TypeScript interfaces (for JS side)
2. Swift Record classes (for iOS)
3. Kotlin Record classes (for Android)

This is repetitive, error-prone, and time-consuming work.

## Solution
This library generates Swift and Kotlin Record classes from TypeScript interfaces automatically.

## References
- Expo Module API: https://docs.expo.dev/modules/module-api/
- Records documentation: https://docs.expo.dev/modules/module-api/#records
- Example TypeScript: https://github.com/hirbod/expo-video-metadata/blob/8f61126abc65ae9ca143527c7b3b097e0174c743/src/ExpoVideoMetadata.types.ts
- Example Swift: https://github.com/hirbod/expo-video-metadata/blob/main/ios/ExpoVideoMetadataOptions.swift
- Example Kotlin: https://github.com/hirbod/expo-video-metadata/blob/main/android/src/main/java/expo/modules/videometadata/VideoMetadataOptions.kt