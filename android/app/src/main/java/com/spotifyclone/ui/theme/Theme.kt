package com.spotifyclone.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val SpotifyGreen = Color(0xFF1DB954)
val SpotifyGreenDark = Color(0xFF1AA34A)
val SpotifyBlack = Color(0xFF121212)
val SpotifyDarkGray = Color(0xFF181818)
val SpotifyMediumGray = Color(0xFF282828)
val SpotifyLightGray = Color(0xFFB3B3B3)
val SpotifyWhite = Color(0xFFFFFFFF)

private val DarkColorScheme = darkColorScheme(
    primary = SpotifyGreen,
    onPrimary = Color.Black,
    secondary = SpotifyGreenDark,
    background = SpotifyBlack,
    surface = SpotifyDarkGray,
    surfaceVariant = SpotifyMediumGray,
    onBackground = SpotifyWhite,
    onSurface = SpotifyWhite,
    onSurfaceVariant = SpotifyLightGray,
)

private val LightColorScheme = lightColorScheme(
    primary = SpotifyGreen,
    onPrimary = Color.White,
    secondary = SpotifyGreenDark,
    background = Color(0xFFF5F5F5),
    surface = Color.White,
    surfaceVariant = Color(0xFFEEEEEE),
    onBackground = Color.Black,
    onSurface = Color.Black,
    onSurfaceVariant = Color(0xFF666666),
)

@Composable
fun SpotifyCloneTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}
