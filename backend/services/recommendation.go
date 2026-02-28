package services

import (
	"context"
	"math/rand"
	"sort"

	"spotify-clone/config"
	"spotify-clone/models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type ScoredSong struct {
	Song  models.Song
	Score float64
}

func GetRecommendations(ctx context.Context, userID string, limit int) ([]models.Song, error) {
	user, err := GetUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	genreScores := make(map[string]int)
	artistScores := make(map[string]int)

	for _, songID := range user.LikedSongs {
		song, err := GetSong(ctx, songID)
		if err != nil {
			continue
		}
		if song.Genre != "" {
			genreScores[song.Genre]++
		}
		if song.ArtistID != "" {
			artistScores[song.ArtistID]++
		}
	}

	for _, songID := range user.RecentlyPlayed {
		song, err := GetSong(ctx, songID)
		if err != nil {
			continue
		}
		if song.Genre != "" {
			genreScores[song.Genre]++
		}
	}

	candidates, err := getRecommendationCandidates(ctx, 100)
	if err != nil {
		return nil, err
	}

	var scored []ScoredSong
	likedSet := toSet(user.LikedSongs)

	for _, song := range candidates {
		if likedSet[song.ID] {
			continue
		}

		score := float64(0)

		if gs, ok := genreScores[song.Genre]; ok {
			score += float64(gs) * 10
		}

		if as, ok := artistScores[song.ArtistID]; ok {
			score += float64(as) * 15
		}

		for _, followedID := range user.Following {
			if song.ArtistID == followedID {
				score += 20
			}
		}

		score += float64(song.PlayCount) * 0.1
		score += rand.Float64() * 5

		scored = append(scored, ScoredSong{Song: song, Score: score})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	result := make([]models.Song, 0, limit)
	for i := 0; i < len(scored) && i < limit; i++ {
		result = append(result, scored[i].Song)
	}

	return result, nil
}

func getRecommendationCandidates(ctx context.Context, limit int) ([]models.Song, error) {
	query := config.FirestoreClient.Collection("songs").
		Where("status", "==", "approved").
		OrderBy("playCount", firestore.Desc).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var songs []models.Song
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var song models.Song
		if err := doc.DataTo(&song); err != nil {
			continue
		}
		song.ID = doc.Ref.ID
		songs = append(songs, song)
	}
	return songs, nil
}

func toSet(slice []string) map[string]bool {
	set := make(map[string]bool, len(slice))
	for _, s := range slice {
		set[s] = true
	}
	return set
}
