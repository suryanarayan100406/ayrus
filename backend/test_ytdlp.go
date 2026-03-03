package main

import (
	"fmt"
	"spotify-clone/services"
)

func main() {
	fmt.Println("Testing GetYouTubeAudioURL...")
	info, err := services.GetYouTubeAudioURL("lYBUbBu4W08")
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return
	}
	fmt.Printf("SUCCESS: %s\n", info.AudioStreams[0].URL)
}
