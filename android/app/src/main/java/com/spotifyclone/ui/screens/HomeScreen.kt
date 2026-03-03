package com.spotifyclone.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.spotifyclone.data.models.Song
import com.spotifyclone.viewmodel.MainViewModel

@Composable
fun HomeScreen(viewModel: MainViewModel = hiltViewModel()) {
    val songsState = viewModel.featuredSongs.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Good Evening",
            style = MaterialTheme.typography.titleLarge.copy(fontSize = 32.sp, fontWeight = FontWeight.Black),
            modifier = Modifier.padding(bottom = 24.dp)
        )

        Text(
            text = "Featured Curation",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Ideally a LazyRow or LazyVerticalGrid for songs will go here once the UI is expanded
        // For scaffold phase we show a simple list or loading state
        
        when (val state = songsState.value) {
            is MainViewModel.UiState.Loading -> {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
            }
            is MainViewModel.UiState.Success<*> -> {
                val songs = state.data as List<Song>
                if (songs.isEmpty()) {
                    Text("No featured songs currently available.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                } else {
                    songs.take(5).forEach { song ->
                        Text("• ${song.title} by ${song.artistName}", style = MaterialTheme.typography.bodyLarge)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
            is MainViewModel.UiState.Error -> {
                Text("Failed to load: ${state.message}", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
