package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// Deezer API - Free, no API key required!
// Provides 30-second previews of nearly every song in the world
// Docs: https://developers.deezer.com/api

type DeezerTrack struct {
	ID            int    `json:"id"`
	Title         string `json:"title"`
	Duration      int    `json:"duration"`
	Preview       string `json:"preview"`
	Link          string `json:"link"`
	Rank          int    `json:"rank"`
	Artist        DeezerArtist `json:"artist"`
	Album         DeezerAlbum  `json:"album"`
}

type DeezerArtist struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Picture string `json:"picture_medium"`
}

type DeezerAlbum struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Cover   string `json:"cover_medium"`
	CoverXL string `json:"cover_xl"`
}

type DeezerSearchResponse struct {
	Data  []DeezerTrack `json:"data"`
	Total int           `json:"total"`
	Next  string        `json:"next"`
}

type DeezerChartResponse struct {
	Tracks struct {
		Data []DeezerTrack `json:"data"`
	} `json:"tracks"`
}

var deezerClient = &http.Client{Timeout: 10 * time.Second}

// SearchDeezer searches for tracks on Deezer
func SearchDeezer(query string, limit int) ([]DeezerTrack, error) {
	apiURL := fmt.Sprintf(
		"https://api.deezer.com/search?q=%s&limit=%d",
		url.QueryEscape(query), limit,
	)

	resp, err := deezerClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("deezer API error: %v", err)
	}
	defer resp.Body.Close()

	var result DeezerSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode deezer response: %v", err)
	}

	return result.Data, nil
}

// GetDeezerChart gets top chart tracks
func GetDeezerChart(limit int) ([]DeezerTrack, error) {
	apiURL := fmt.Sprintf("https://api.deezer.com/chart/0/tracks?limit=%d", limit)

	resp, err := deezerClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("deezer API error: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Data []DeezerTrack `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode deezer chart: %v", err)
	}

	return result.Data, nil
}

// GetDeezerGenre gets tracks from a specific genre/radio
func GetDeezerByGenre(genreID int, limit int) ([]DeezerTrack, error) {
	apiURL := fmt.Sprintf("https://api.deezer.com/radio/%d/tracks?limit=%d", genreID, limit)

	resp, err := deezerClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("deezer API error: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Data []DeezerTrack `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode deezer genre: %v", err)
	}

	return result.Data, nil
}
