package main

import (
	"fmt"
	"spotify-clone/services"
)

func main() {
	tracks, err := services.SearchYouTubeMusic("Justin Bieber Baby", 1)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	if len(tracks) > 0 {
		fmt.Printf("Track ID: '%s'\n", tracks[0].VideoID)
		fmt.Printf("Track Title: '%s'\n", tracks[0].Title)
	} else {
		fmt.Println("No tracks found")
	}
}
