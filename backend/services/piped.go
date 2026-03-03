package services

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// YouTube Music via yt-dlp
// Uses yt-dlp standalone binary for reliable YouTube audio extraction
// No external proxy services needed — works directly with YouTube

// YTDLPResult represents a search result from yt-dlp
type YTDLPResult struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Channel     string  `json:"channel"`
	Duration    float64 `json:"duration"`
	ViewCount   int64   `json:"view_count"`
	Thumbnail   string  `json:"thumbnail"`
	WebpageURL  string  `json:"webpage_url"`
	URL         string  `json:"url"`
	Description string  `json:"description"`
}

// PipedTrack is our simplified track format for the frontend
type PipedTrack struct {
	VideoID   string `json:"videoId"`
	Title     string `json:"title"`
	Artist    string `json:"artist"`
	Thumbnail string `json:"thumbnail"`
	Duration  int    `json:"duration"`
	AudioURL  string `json:"audioUrl,omitempty"`
	Views     int64  `json:"views"`
}

// Cache for audio URLs (they expire after ~6 hours)
var (
	audioCache     = make(map[string]cachedAudio)
	audioCacheMu   sync.RWMutex
)

type cachedAudio struct {
	URL       string
	ExpiresAt time.Time
}

// getYTDLPPath returns the absolute path to the yt-dlp binary
func getYTDLPPath() string {
	var exeName string
	if runtime.GOOS == "windows" {
		exeName = "yt-dlp.exe"
	} else {
		exeName = "yt-dlp"
	}
	absPath, err := filepath.Abs(exeName)
	if err != nil {
		return exeName // fallback
	}
	return absPath
}

func SearchYouTubeMusic(query string, limit int) ([]PipedTrack, error) {
	if limit <= 0 || limit > 30 {
		limit = 10
	}

	// Fetch limit + 10 tracks to have a healthy pool to filter/sort while keeping yt-dlp fast
	fetchCount := limit + 10
	ytdlp := getYTDLPPath()
	searchQuery := strings.TrimSpace(query)
	// Add "official song" to bias YouTube towards actual music if not already present
	if !strings.Contains(strings.ToLower(searchQuery), "song") && !strings.Contains(strings.ToLower(searchQuery), "music") {
		searchQuery += " official song"
	}
	searchStr := fmt.Sprintf("ytsearch%d:%s", fetchCount, searchQuery)

	cmd := exec.Command(ytdlp,
		"--dump-json",
		"-q",
		"--no-playlist",
		"--no-cache-dir",
		"--flat-playlist",
		"--no-warnings",
		"--no-check-certificates",
		"--socket-timeout", "10",
		searchStr,
	)

	output, err := cmd.Output()
	if err != nil {
		// yt-dlp returns exit code 1 sometimes even with valid output
		if len(output) == 0 {
			return nil, fmt.Errorf("yt-dlp search failed: %v", err)
		}
	}

	// Parse JSONL (one JSON object per line)
	var allTracks []PipedTrack
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		var result YTDLPResult
		if err := json.Unmarshal([]byte(line), &result); err != nil {
			continue
		}

		// Skip if no ID
		if result.ID == "" {
			continue
		}

		// Filter out Shorts (<60s) and long mixes/compilations (>12m)
		if result.Duration < 60 || result.Duration > 720 {
			continue
		}

		// Clean up channel name (remove " - Topic" and "Official")
		artist := strings.TrimSuffix(result.Channel, " - Topic")
		artist = strings.TrimSuffix(artist, "Official")
		artist = strings.TrimSuffix(artist, "VEVO")
		artist = strings.TrimSpace(artist)
		if artist == "" {
			artist = "Unknown Artist"
		}

		// Use a good thumbnail
		thumbnail := result.Thumbnail
		if thumbnail == "" {
			thumbnail = fmt.Sprintf("https://i.ytimg.com/vi/%s/hqdefault.jpg", result.ID)
		}

		allTracks = append(allTracks, PipedTrack{
			VideoID:   result.ID,
			Title:     result.Title,
			Artist:    artist,
			Thumbnail: thumbnail,
			Duration:  int(result.Duration),
			Views:     result.ViewCount,
		})
	}

	// Sort tracks by views descending (most popular first)
	for i := 0; i < len(allTracks); i++ {
		for j := i + 1; j < len(allTracks); j++ {
			if allTracks[i].Views < allTracks[j].Views {
				allTracks[i], allTracks[j] = allTracks[j], allTracks[i]
			}
		}
	}

	// Return top `limit` tracks
	if len(allTracks) > limit {
		return allTracks[:limit], nil
	}

	return allTracks, nil
}

// GetYouTubeTrending gets trending music from YouTube
func GetYouTubeTrending(region string, limit int) ([]PipedTrack, error) {
	// Use yt-dlp to search for trending music
	return SearchYouTubeMusic("trending music 2025 hits popular", limit)
}

// GetYouTubeAudioURL gets the direct audio stream URL for a video
func GetYouTubeAudioURL(videoID string) (*PipedStreamInfo, error) {
	// Check cache first
	audioCacheMu.RLock()
	if cached, ok := audioCache[videoID]; ok && time.Now().Before(cached.ExpiresAt) {
		audioCacheMu.RUnlock()
		return &PipedStreamInfo{
			AudioStreams: []PipedAudioStream{{URL: cached.URL}},
		}, nil
	}
	audioCacheMu.RUnlock()

	ytdlp := getYTDLPPath()
	videoURL := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID)

	// Get the best audio URL
	cmd := exec.Command(ytdlp,
		"-g",                                  // Print URL only
		"-q",                                  // Quiet
		"--no-playlist",                       // Single video only
		"--no-cache-dir",                      // Don't waste time on cache
		"-f", "bestaudio[ext=m4a]/bestaudio",  // Best audio, prefer m4a
		"--no-warnings",
		"--no-check-certificates",
		"--socket-timeout", "10",
		videoURL,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("yt-dlp failed for %s. Output: %s\n", videoID, string(output))
		return nil, fmt.Errorf("yt-dlp audio extraction failed: %v", err)
	}

	audioURL := strings.TrimSpace(string(output))
	if audioURL == "" {
		return nil, fmt.Errorf("no audio URL returned")
	}

	// Cache for 5 hours (YouTube URLs expire after ~6 hours)
	audioCacheMu.Lock()
	audioCache[videoID] = cachedAudio{
		URL:       audioURL,
		ExpiresAt: time.Now().Add(5 * time.Hour),
	}
	audioCacheMu.Unlock()

	return &PipedStreamInfo{
		AudioStreams: []PipedAudioStream{{URL: audioURL}},
	}, nil
}

// GetBestAudioURL extracts the best audio URL from stream info
func GetBestAudioURL(info *PipedStreamInfo) string {
	if len(info.AudioStreams) == 0 {
		return ""
	}
	return info.AudioStreams[0].URL
}

// Keep these types for compatibility with existing handler code
type PipedStreamInfo struct {
	Title       string            `json:"title"`
	Uploader    string            `json:"uploader"`
	Thumbnail   string            `json:"thumbnail"`
	Duration    int               `json:"duration"`
	AudioStreams []PipedAudioStream `json:"audioStreams"`
}

type PipedAudioStream struct {
	URL      string `json:"url"`
	MimeType string `json:"mimeType"`
	Bitrate  int    `json:"bitrate"`
}

type PipedSearchResult struct{}
