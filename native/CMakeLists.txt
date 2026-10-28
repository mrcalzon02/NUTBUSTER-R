cmake_minimum_required(VERSION 3.24)
project(NUTBUSTER_Native LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
include(FetchContent)

# Official native SDL3: no embedded browser, Chromium, WebView, JavaScript, or server.
set(SDL_SHARED OFF CACHE BOOL "" FORCE)
set(SDL_STATIC ON CACHE BOOL "" FORCE)
set(SDL_TESTS OFF CACHE BOOL "" FORCE)
set(SDL_EXAMPLES OFF CACHE BOOL "" FORCE)
set(SDL_DISABLE_INSTALL ON CACHE BOOL "" FORCE)
FetchContent_Declare(SDL3
  GIT_REPOSITORY https://github.com/libsdl-org/SDL.git
  GIT_TAG release-3.4.18
  GIT_SHALLOW TRUE)
FetchContent_MakeAvailable(SDL3)

add_library(nutbuster-core src/core.cpp src/mine.cpp src/campaign.cpp)
target_include_directories(nutbuster-core PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/src")
# Build-time parity executable only; never install into native preview packages.
add_executable(nutbuster-hold-parity-test src/hold_parity_test.cpp)
enable_testing()
add_test(NAME nutbuster-held-nut-js-parity
  COMMAND nutbuster-hold-parity-test
  "${CMAKE_CURRENT_SOURCE_DIR}/generated-assets/hold-fixtures.txt")
add_executable(nutbuster-native src/main.cpp)
target_link_libraries(nutbuster-native PRIVATE nutbuster-core SDL3::SDL3)
if(WIN32)
  set_target_properties(nutbuster-native PROPERTIES OUTPUT_NAME "NUTBUSTER-Windows-x64")
else()
  set_target_properties(nutbuster-native PROPERTIES OUTPUT_NAME "NUTBUSTER-Linux-x64")
endif()
if(MSVC)
  target_compile_options(nutbuster-core PRIVATE /W4)
  target_compile_options(nutbuster-hold-parity-test PRIVATE /W4 /WX)
else()
  target_compile_options(nutbuster-core PRIVATE -Wall -Wextra -Wpedantic)
  target_compile_options(nutbuster-hold-parity-test PRIVATE -Wall -Wextra -Werror -Wpedantic)
endif()
install(TARGETS nutbuster-native RUNTIME DESTINATION .)
install(DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/generated-assets/data" DESTINATION .)
