#pragma once

struct FConfiguration
{
    static inline auto Playlist = L"/Game/Athena/Playlists/Low/Playlist_Low_Solo.Playlist_Low_Solo";
    static inline auto MaxTickRate = 30;
    static inline auto bLateGame = false;
    static inline auto LateGameZone = 6;          
    static inline auto bLateGameLongZone = true; 
    static inline auto bEnableCheats = false;
    static inline auto SiphonAmount = 50; 
    static inline auto bInfiniteMats = false;
    static inline auto bInfiniteAmmo = false;
    static inline auto bForceRespawns = true; 
    static inline auto bJoinInProgress = false;
    static inline auto bAutoRestart = false;
    static inline auto bKeepInventory = false;
    static inline auto Port = 7777;
    static inline auto bEnableIris = true;
    static inline constexpr auto bGUI = true;
    static inline constexpr auto bCustomCrashReporter = true;
    static inline constexpr auto bUseStdoutLog = false;
    static inline constexpr auto WebhookURL = ""; 
};
