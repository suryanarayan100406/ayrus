package com.spotifyclone.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spotifyclone.ui.components.SectionHeader

@Composable
fun LibraryScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .padding(top = 24.dp)
    ) {
        Text(
            text = "Your Library",
            style = MaterialTheme.typography.titleLarge.copy(fontSize = 32.sp, fontWeight = FontWeight.Black),
            modifier = Modifier.padding(bottom = 24.dp)
        )

        SectionHeader(title = "Playlists")
        // Lazy Column of Playlists

        Spacer(modifier = Modifier.height(24.dp))

        SectionHeader(title = "Liked Songs")
        // LazyRow of Liked Songs
    }
}
