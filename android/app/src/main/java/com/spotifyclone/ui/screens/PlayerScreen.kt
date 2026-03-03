package com.spotifyclone.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spotifyclone.data.models.Song

@Composable
fun PlayerScreen(
    currentSong: Song?,
    isPlaying: Boolean,
    onPlayPause: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit
) {
    if (currentSong == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No song currently playing")
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .padding(top = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Now Playing",
            style = MaterialTheme.typography.titleMedium,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        // Album Art
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.DarkGray)
        ) {
            // Using placeholder or Coil here
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Titles
        Text(
            text = currentSong.title,
            style = MaterialTheme.typography.titleLarge.copy(fontSize = 28.sp, fontWeight = FontWeight.Black),
            maxLines = 1
        )
        Text(
            text = currentSong.artistName,
            style = MaterialTheme.typography.titleMedium,
            color = Color.Gray,
            modifier = Modifier.padding(top = 8.dp)
        )

        Spacer(modifier = Modifier.weight(1f))

        // Controls
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 48.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onPrevious) {
                Icon(Icons.Default.SkipPrevious, contentDescription = "Previous", modifier = Modifier.size(48.dp))
            }
            
            FloatingActionButton(
                onClick = onPlayPause,
                containerColor = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(72.dp)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = "Play/Pause", modifier = Modifier.size(40.dp), tint = Color.Black)
            }
            
            IconButton(onClick = onNext) {
                Icon(Icons.Default.SkipNext, contentDescription = "Next", modifier = Modifier.size(48.dp))
            }
        }
    }
}
