package com.spotifyclone.data.models

data class UserProfile(
    val uid: String,
    val email: String?,
    val displayName: String?,
    val photoURL: String?,
    val role: String,
    val followersCount: Int = 0
)

data class Song(
    val id: String,
    val title: String,
    val artistName: String,
    val coverURL: String?,
    val streamUrl: String?, // Resolved URL
    val source: String,
    val duration: Int = 0
)

data class Playlist(
    val id: String,
    val name: String,
    val isPublic: Boolean,
    val songIds: List<String> = emptyList(),
    val coverURL: String?
)
