package com.spotifyclone.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val DarkCyan = Color(0xFF00CED1)
val DefaultDarkBackground = Color(0xFF121212)
val DefaultSurface = Color(0xFF1E1E1E)

private val DarkColorScheme = darkColorScheme(
    primary = DarkCyan,
    background = DefaultDarkBackground,
    surface = DefaultSurface,
    onPrimary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun SpotifyCloneTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // Forcing Dark Theme for this app based on design specs
    val colorScheme = DarkColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
