package com.spotifyclone.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spotifyclone.data.models.Song
import com.spotifyclone.data.models.UserProfile
import com.spotifyclone.data.remote.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    sealed class UiState {
        object Loading : UiState()
        data class Success<T>(val data: T) : UiState()
        data class Error(val message: String) : UiState()
    }

    private val _currentUser = MutableStateFlow<UiState>(UiState.Loading)
    val currentUser: StateFlow<UiState> = _currentUser

    private val _featuredSongs = MutableStateFlow<UiState>(UiState.Loading)
    val featuredSongs: StateFlow<UiState> = _featuredSongs

    init {
        // You would typically wait for Firebase Auth to confirm login before calling these
        // loadInitialData()
    }

    fun loadInitialData() {
        fetchCurrentUser()
        fetchFeaturedSongs()
    }

    private fun fetchCurrentUser() {
        viewModelScope.launch {
            try {
                val user = apiService.getCurrentUser()
                _currentUser.value = UiState.Success(user)
            } catch (e: Exception) {
                _currentUser.value = UiState.Error(e.message ?: "Failed to fetch user")
            }
        }
    }

    private fun fetchFeaturedSongs() {
        viewModelScope.launch {
            try {
                val songs = apiService.getFeaturedSongs()
                _featuredSongs.value = UiState.Success(songs)
            } catch (e: Exception) {
                _featuredSongs.value = UiState.Error(e.message ?: "Failed to fetch featured")
            }
        }
    }
}
