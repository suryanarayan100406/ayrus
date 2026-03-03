package com.spotifyclone.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.spotifyclone.data.models.Song
import com.spotifyclone.ui.components.SectionHeader
import com.spotifyclone.ui.components.SongCard
import com.spotifyclone.ui.theme.DarkCyan
import com.spotifyclone.ui.theme.DefaultDarkBackground
import com.spotifyclone.viewmodel.MainViewModel

@Composable
fun HomeScreen(viewModel: MainViewModel = hiltViewModel()) {
    val featuredState by viewModel.featuredSongs.collectAsState()
    val feedState by viewModel.feedSongs.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadInitialData()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        DarkCyan.copy(alpha = 0.3f),
                        DefaultDarkBackground,
                        DefaultDarkBackground
                    ),
                    startY = 0f,
                    endY = 1000f
                )
            )
            .padding(top = 40.dp, bottom = 20.dp)
    ) {
        item {
            Text(
                text = "Good Evening",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Black
                ),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp)
            )
        }

        // Featured Section
        item {
            SectionHeader(title = "Featured Showcase", modifier = Modifier.padding(horizontal = 8.dp))
            MusicSection(state = featuredState, onSongClick = { /* TODO Play */ })
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }

        // Trending/Feed Section
        item {
            SectionHeader(title = "Trending Now", modifier = Modifier.padding(horizontal = 8.dp))
            MusicSection(state = feedState, onSongClick = { /* TODO Play */ })
        }
        
        item {
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun MusicSection(
    state: MainViewModel.UiState,
    onSongClick: (Song) -> Unit
) {
    when (state) {
        is MainViewModel.UiState.Loading -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = DarkCyan)
            }
        }
        is MainViewModel.UiState.Success<*> -> {
            val songs = state.data as List<Song>
            if (songs.isEmpty()) {
                Text(
                    text = "No tracks available.",
                    modifier = Modifier.padding(horizontal = 16.dp),
                    color = Color.Gray
                )
            } else {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(songs) { song ->
                        SongCard(
                            song = song,
                            onClick = { onSongClick(song) }
                        )
                    }
                }
            }
        }
        is MainViewModel.UiState.Error -> {
            Text(
                text = "Failed: ${state.message}",
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }
    }
}
