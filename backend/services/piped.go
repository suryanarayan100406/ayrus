package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Piped API - Open-source YouTube frontend
// Provides audio stream URLs without API key
// Docs: https://docs.piped.video/docs/api-documentation/
// Multiple public instances available as fallbacks

var pipedInstances = []string{
	"https://pipedapi.kavin.rocks",
	"https://pipedapi.adminforge.de",
	"https://api.piped.yt",
}

var pipedClient = &http.Client{Timeout: 15 * time.Second}

// PipedSearchResult represents a search result item
type PipedSearchResult struct {
	URL              string `json:"url"`              // /watch?v=VIDEO_ID
	Title            string `json:"title"`
	Thumbnail        string `json:"thumbnail"`
	UploaderName     string `json:"uploaderName"`
	UploaderURL      string `json:"uploaderUrl"`
	Duration         int    `json:"duration"`         // seconds
	Views            int64  `json:"views"`
	UploadedDate     string `json:"uploadedDate"`
	Type             string `json:"type"`             // "stream" for videos
	IsShort          bool   `json:"isShort"`
}

// PipedStreamInfo contains audio stream data for a video
type PipedStreamInfo struct {
	Title           string            `json:"title"`
	Uploader        string            `json:"uploader"`
	UploaderURL     string            `json:"uploaderUrl"`
	Thumbnail       string            `json:"thumbnail"`
	Duration        int               `json:"duration"`
	Views           int64             `json:"views"`
	AudioStreams    []PipedAudioStream `json:"audioStreams"`
	RelatedStreams  []PipedSearchResult `json:"relatedStreams"`
}

type PipedAudioStream struct {
	URL       string `json:"url"`
	Format    string `json:"format"`
	Quality   string `json:"quality"`
	MimeType  string `json:"mimeType"`
	Bitrate   int    `json:"bitrate"`
	Codec     string `json:"codec"`
}

// PipedTrack is our simplified track format for the frontend
type PipedTrack struct {
	VideoID      string `json:"videoId"`
	Title        string `json:"title"`
	Artist       string `json:"artist"`
	Thumbnail    string `json:"thumbnail"`
	Duration     int    `json:"duration"`
	AudioURL     string `json:"audioUrl"`
	Views        int64  `json:"views"`
}

// pipedRequest makes a request to Piped API with fallback instances
func pipedRequest(path string) (*http.Response, error) {
	var lastErr error
	for _, instance := range pipedInstances {
		resp, err := pipedClient.Get(instance + path)
		if err != nil {
			lastErr = err
			continue
		}
		if resp.StatusCode == 200 {
			return resp, nil
		}
		resp.Body.Close()
		lastErr = fmt.Errorf("HTTP %d from %s", resp.StatusCode, instance)
	}
	return nil, fmt.Errorf("all Piped instances failed: %v", lastErr)
}

// extractVideoID extracts video ID from URL like "/watch?v=dQw4w9WgXcQ"
func extractVideoID(watchURL string) string {
	if strings.Contains(watchURL, "v=") {
		parts := strings.Split(watchURL, "v=")
		if len(parts) > 1 {
			// Remove any trailing parameters
			id := strings.Split(parts[1], "&")[0]
			return id
		}
	}
	// Fallback: just use the last path segment
	parts := strings.Split(watchURL, "/")
	return parts[len(parts)-1]
}

// SearchYouTubeMusic searches YouTube for music only
func SearchYouTubeMusic(query string, limit int) ([]PipedTrack, error) {
	path := fmt.Sprintf("/search?q=%s&filter=music_songs", url.QueryEscape(query))

	resp, err := pipedRequest(path)
	if err != nil {
		return nil, fmt.Errorf("piped search error: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Items []PipedSearchResult `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode piped response: %v", err)
	}

	var tracks []PipedTrack
	for _, item := range result.Items {
		// Skip shorts and non-stream types
		if item.IsShort || item.Type != "stream" {
			continue
		}
		// Skip very short clips (< 30 seconds) or extremely long (> 15 min)
		if item.Duration < 30 || item.Duration > 900 {
			continue
		}

		videoID := extractVideoID(item.URL)
		tracks = append(tracks, PipedTrack{
			VideoID:   videoID,
			Title:     item.Title,
			Artist:    item.UploaderName,
			Thumbnail: item.Thumbnail,
			Duration:  item.Duration,
			Views:     item.Views,
		})

		if len(tracks) >= limit {
			break
		}
	}

	return tracks, nil
}

// GetYouTubeTrending gets trending music
func GetYouTubeTrending(region string, limit int) ([]PipedTrack, error) {
	if region == "" {
		region = "US"
	}
	path := fmt.Sprintf("/trending?region=%s", region)

	resp, err := pipedRequest(path)
	if err != nil {
		return nil, fmt.Errorf("piped trending error: %v", err)
	}
	defer resp.Body.Close()

	var items []PipedSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, fmt.Errorf("failed to decode piped trending: %v", err)
	}

	var tracks []PipedTrack
	for _, item := range items {
		if item.IsShort {
			continue
		}
		// Filter for music-like content (reasonable duration)
		if item.Duration < 60 || item.Duration > 600 {
			continue
		}

		videoID := extractVideoID(item.URL)
		tracks = append(tracks, PipedTrack{
			VideoID:   videoID,
			Title:     item.Title,
			Artist:    item.UploaderName,
			Thumbnail: item.Thumbnail,
			Duration:  item.Duration,
			Views:     item.Views,
		})

		if len(tracks) >= limit {
			break
		}
	}

	return tracks, nil
}

// GetYouTubeAudioURL gets the best audio stream URL for a video
func GetYouTubeAudioURL(videoID string) (*PipedStreamInfo, error) {
	path := fmt.Sprintf("/streams/%s", videoID)

	resp, err := pipedRequest(path)
	if err != nil {
		return nil, fmt.Errorf("piped stream error: %v", err)
	}
	defer resp.Body.Close()

	var info PipedStreamInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("failed to decode stream info: %v", err)
	}

	return &info, nil
}

// GetBestAudioURL extracts the best quality audio URL from stream info
func GetBestAudioURL(info *PipedStreamInfo) string {
	if len(info.AudioStreams) == 0 {
		return ""
	}

	// Find the best quality audio stream (prefer m4a/mp4 over webm for browser compat)
	best := info.AudioStreams[0]
	for _, stream := range info.AudioStreams {
		// Prefer m4a/mp4 format for wider browser compatibility
		isM4A := strings.Contains(stream.MimeType, "mp4") || strings.Contains(stream.MimeType, "m4a")
		bestIsM4A := strings.Contains(best.MimeType, "mp4") || strings.Contains(best.MimeType, "m4a")

		if isM4A && !bestIsM4A {
			best = stream
		} else if isM4A == bestIsM4A && stream.Bitrate > best.Bitrate {
			best = stream
		}
	}

	return best.URL
}
