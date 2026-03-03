package com.spotifyclone.data.remote

import com.spotifyclone.data.models.Playlist
import com.spotifyclone.data.models.Song
import com.spotifyclone.data.models.UserProfile
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @GET("users/me")
    suspend fun getCurrentUser(): UserProfile

    @GET("songs")
    suspend fun getSongs(
        @Query("limit") limit: Int? = null,
        @Query("genre") genre: String? = null
    ): List<Song>

    @GET("users/{id}/liked-songs")
    suspend fun getLikedSongs(@Path("id") uid: String = "me"): List<Song>

    @GET("discover/featured")
    suspend fun getFeaturedSongs(): List<Song>

    @GET("discover/jamendo")
    suspend fun getJamendoSongs(): List<Song>

    @GET("discover/youtube")
    suspend fun getYouTubeSongs(): List<Song>
}
