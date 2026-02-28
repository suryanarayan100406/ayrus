package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// Internet Archive - massive free audio library
// No API key required!

type IASearchResult struct {
	ResponseHeader struct {
		NumFound int `json:"numFound"`
	} `json:"response"`
	Response struct {
		Docs []IAItem `json:"docs"`
	} `json:"response"`
}

type IAItem struct {
	Identifier  string   `json:"identifier"`
	Title       string   `json:"title"`
	Creator     string   `json:"creator"`
	Description string   `json:"description"`
	Date        string   `json:"date"`
	Downloads   int      `json:"downloads"`
	MediaType   string   `json:"mediatype"`
	Subject     []string `json:"subject"`
}

type IAFileMetadata struct {
	Files []IAFile `json:"files"`
}

type IAFile struct {
	Name   string `json:"name"`
	Format string `json:"format"`
	Size   string `json:"size"`
	Length string `json:"length"`
	Title  string `json:"title"`
}

var iaClient = &http.Client{Timeout: 15 * time.Second}

func SearchInternetArchive(query string, limit int) ([]IAItem, error) {
	apiURL := fmt.Sprintf(
		"https://archive.org/advancedsearch.php?q=%s+AND+mediatype:audio&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=date&fl[]=downloads&fl[]=description&fl[]=subject&sort[]=downloads+desc&rows=%d&output=json",
		url.QueryEscape(query), limit,
	)

	resp, err := iaClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("internet archive API error: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Response struct {
			Docs []IAItem `json:"docs"`
		} `json:"response"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode IA response: %v", err)
	}

	return result.Response.Docs, nil
}

func GetIAItemFiles(identifier string) ([]IAFile, error) {
	apiURL := fmt.Sprintf("https://archive.org/metadata/%s/files", identifier)

	resp, err := iaClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("IA metadata error: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Result []IAFile `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode IA file metadata: %v", err)
	}

	// Filter to audio files only
	var audioFiles []IAFile
	for _, f := range result.Result {
		switch f.Format {
		case "VBR MP3", "MP3", "128Kbps MP3", "Ogg Vorbis", "Flac":
			audioFiles = append(audioFiles, f)
		}
	}

	return audioFiles, nil
}

// GetIAStreamURL returns a direct streaming URL for an Internet Archive file
func GetIAStreamURL(identifier, filename string) string {
	return fmt.Sprintf("https://archive.org/download/%s/%s", identifier, url.PathEscape(filename))
}
