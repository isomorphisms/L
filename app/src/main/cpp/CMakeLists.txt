cmake_minimum_required(VERSION 3.22.1)
project(l LANGUAGES C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

set(NATIVE_APP_GLUE "${ANDROID_NDK}/sources/android/native_app_glue")

add_library(
    l
    SHARED
    l.c
    "${NATIVE_APP_GLUE}/android_native_app_glue.c"
)

target_include_directories(l PRIVATE "${NATIVE_APP_GLUE}")
target_link_libraries(l android EGL GLESv3 log m)
