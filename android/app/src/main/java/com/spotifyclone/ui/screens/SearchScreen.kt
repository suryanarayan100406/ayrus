package com.spotifyclone.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen() {
    var query by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .padding(top = 24.dp)
    ) {
        Text(
            text = "Search",
            style = MaterialTheme.typography.titleLarge.copy(fontSize = 32.sp, fontWeight = FontWeight.Black),
            modifier = Modifier.padding(bottom = 24.dp)
        )

        SearchBar(
            query = query,
            onQueryChange = { query = it },
            onSearch = { /* Execute search */ },
            active = false,
            onActiveChange = { },
            placeholder = { Text("What do you want to listen to?") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier.fillMaxWidth()
        ) {
            // Search Results would go here
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(
            text = "Browse all",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        // Grid of Genres/Categories would go here
    }
}
