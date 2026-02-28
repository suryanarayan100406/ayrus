package services

import (
	"context"

	"spotify-clone/config"
	"spotify-clone/models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// ---- Users ----

func CreateUser(ctx context.Context, user models.User) error {
	_, err := config.FirestoreClient.Collection("users").Doc(user.UID).Set(ctx, user)
	return err
}

func GetUser(ctx context.Context, uid string) (*models.User, error) {
	doc, err := config.FirestoreClient.Collection("users").Doc(uid).Get(ctx)
	if err != nil {
		return nil, err
	}
	var user models.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

func UpdateUser(ctx context.Context, uid string, updates map[string]interface{}) error {
	updatePairs := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		updatePairs = append(updatePairs, firestore.Update{Path: k, Value: v})
	}
	_, err := config.FirestoreClient.Collection("users").Doc(uid).Update(ctx, updatePairs)
	return err
}

// ---- Songs ----

func CreateSong(ctx context.Context, song models.Song) (string, error) {
	ref, _, err := config.FirestoreClient.Collection("songs").Add(ctx, song)
	if err != nil {
		return "", err
	}
	// Update the song with its auto-generated ID
	_, err = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, err
}

func GetSong(ctx context.Context, id string) (*models.Song, error) {
	doc, err := config.FirestoreClient.Collection("songs").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var song models.Song
	if err := doc.DataTo(&song); err != nil {
		return nil, err
	}
	song.ID = doc.Ref.ID
	return &song, nil
}

func GetSongs(ctx context.Context, limit int, genre, status string) ([]models.Song, error) {
	query := config.FirestoreClient.Collection("songs").Query
	if status != "" {
		query = query.Where("status", "==", status)
	}
	if genre != "" {
		query = query.Where("genre", "==", genre)
	}
	query = query.OrderBy("createdAt", firestore.Desc).Limit(limit)

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

func UpdateSong(ctx context.Context, id string, updates map[string]interface{}) error {
	updatePairs := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		updatePairs = append(updatePairs, firestore.Update{Path: k, Value: v})
	}
	_, err := config.FirestoreClient.Collection("songs").Doc(id).Update(ctx, updatePairs)
	return err
}

func DeleteSong(ctx context.Context, id string) error {
	_, err := config.FirestoreClient.Collection("songs").Doc(id).Delete(ctx)
	return err
}

func GetSongsByArtist(ctx context.Context, artistID string, limit int) ([]models.Song, error) {
	query := config.FirestoreClient.Collection("songs").
		Where("artistId", "==", artistID).
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

func IncrementPlayCount(ctx context.Context, songID string) error {
	_, err := config.FirestoreClient.Collection("songs").Doc(songID).Update(ctx, []firestore.Update{
		{Path: "playCount", Value: firestore.Increment(1)},
	})
	return err
}

// ---- Playlists ----

func CreatePlaylist(ctx context.Context, playlist models.Playlist) (string, error) {
	ref, _, err := config.FirestoreClient.Collection("playlists").Add(ctx, playlist)
	if err != nil {
		return "", err
	}
	_, err = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, err
}

func GetPlaylist(ctx context.Context, id string) (*models.Playlist, error) {
	doc, err := config.FirestoreClient.Collection("playlists").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var pl models.Playlist
	if err := doc.DataTo(&pl); err != nil {
		return nil, err
	}
	pl.ID = doc.Ref.ID
	return &pl, nil
}

func GetUserPlaylists(ctx context.Context, userID string) ([]models.Playlist, error) {
	query := config.FirestoreClient.Collection("playlists").
		Where("userId", "==", userID).
		OrderBy("createdAt", firestore.Desc)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var playlists []models.Playlist
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var pl models.Playlist
		if err := doc.DataTo(&pl); err != nil {
			continue
		}
		pl.ID = doc.Ref.ID
		playlists = append(playlists, pl)
	}
	return playlists, nil
}

func UpdatePlaylist(ctx context.Context, id string, updates map[string]interface{}) error {
	updatePairs := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		updatePairs = append(updatePairs, firestore.Update{Path: k, Value: v})
	}
	_, err := config.FirestoreClient.Collection("playlists").Doc(id).Update(ctx, updatePairs)
	return err
}

func DeletePlaylist(ctx context.Context, id string) error {
	_, err := config.FirestoreClient.Collection("playlists").Doc(id).Delete(ctx)
	return err
}

// ---- Artists ----

func CreateArtist(ctx context.Context, artist models.Artist) error {
	_, err := config.FirestoreClient.Collection("artists").Doc(artist.UID).Set(ctx, artist)
	return err
}

func GetArtist(ctx context.Context, uid string) (*models.Artist, error) {
	doc, err := config.FirestoreClient.Collection("artists").Doc(uid).Get(ctx)
	if err != nil {
		return nil, err
	}
	var artist models.Artist
	if err := doc.DataTo(&artist); err != nil {
		return nil, err
	}
	return &artist, nil
}

func GetArtists(ctx context.Context, status string, limit int) ([]models.Artist, error) {
	query := config.FirestoreClient.Collection("artists").Query
	if status != "" {
		query = query.Where("status", "==", status)
	}
	query = query.OrderBy("createdAt", firestore.Desc).Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var artists []models.Artist
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var artist models.Artist
		if err := doc.DataTo(&artist); err != nil {
			continue
		}
		artists = append(artists, artist)
	}
	return artists, nil
}

func UpdateArtist(ctx context.Context, uid string, updates map[string]interface{}) error {
	updatePairs := make([]firestore.Update, 0, len(updates))
	for k, v := range updates {
		updatePairs = append(updatePairs, firestore.Update{Path: k, Value: v})
	}
	_, err := config.FirestoreClient.Collection("artists").Doc(uid).Update(ctx, updatePairs)
	return err
}

// ---- Albums ----

func CreateAlbum(ctx context.Context, album models.Album) (string, error) {
	ref, _, err := config.FirestoreClient.Collection("albums").Add(ctx, album)
	if err != nil {
		return "", err
	}
	_, err = ref.Update(ctx, []firestore.Update{{Path: "id", Value: ref.ID}})
	return ref.ID, err
}

func GetAlbum(ctx context.Context, id string) (*models.Album, error) {
	doc, err := config.FirestoreClient.Collection("albums").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var album models.Album
	if err := doc.DataTo(&album); err != nil {
		return nil, err
	}
	album.ID = doc.Ref.ID
	return &album, nil
}

func GetAlbumsByArtist(ctx context.Context, artistID string) ([]models.Album, error) {
	query := config.FirestoreClient.Collection("albums").
		Where("artistId", "==", artistID).
		OrderBy("createdAt", firestore.Desc)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var albums []models.Album
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var album models.Album
		if err := doc.DataTo(&album); err != nil {
			continue
		}
		album.ID = doc.Ref.ID
		albums = append(albums, album)
	}
	return albums, nil
}

// ---- Search ----

func SearchSongs(ctx context.Context, query string, limit int) ([]models.Song, error) {
	// Firestore doesn't support full-text search natively,
	// so we search by prefix matching on the title
	iter := config.FirestoreClient.Collection("songs").
		Where("status", "==", "approved").
		OrderBy("title").
		StartAt(query).
		EndAt(query + "\uf8ff").
		Limit(limit).
		Documents(ctx)
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

func SearchArtists(ctx context.Context, query string, limit int) ([]models.Artist, error) {
	iter := config.FirestoreClient.Collection("artists").
		Where("status", "==", "approved").
		OrderBy("displayName").
		StartAt(query).
		EndAt(query + "\uf8ff").
		Limit(limit).
		Documents(ctx)
	defer iter.Stop()

	var artists []models.Artist
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var artist models.Artist
		if err := doc.DataTo(&artist); err != nil {
			continue
		}
		artists = append(artists, artist)
	}
	return artists, nil
}

// ---- Analytics ----

func RecordPlay(ctx context.Context, songID, userID string) error {
	_, _, err := config.FirestoreClient.Collection("analytics").Add(ctx, map[string]interface{}{
		"songId":    songID,
		"userId":    userID,
		"timestamp": firestore.ServerTimestamp,
	})
	if err != nil {
		return err
	}
	return IncrementPlayCount(ctx, songID)
}

// ---- Dashboard Stats ----

func GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Count users
	usersIter := config.FirestoreClient.Collection("users").Documents(ctx)
	userCount := 0
	for {
		_, err := usersIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		userCount++
	}
	usersIter.Stop()
	stats["totalUsers"] = userCount

	// Count songs
	songsIter := config.FirestoreClient.Collection("songs").Documents(ctx)
	songCount := 0
	for {
		_, err := songsIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		songCount++
	}
	songsIter.Stop()
	stats["totalSongs"] = songCount

	// Count artists
	artistsIter := config.FirestoreClient.Collection("artists").Where("status", "==", "approved").Documents(ctx)
	artistCount := 0
	for {
		_, err := artistsIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		artistCount++
	}
	artistsIter.Stop()
	stats["totalArtists"] = artistCount

	// Count pending songs
	pendingIter := config.FirestoreClient.Collection("songs").Where("status", "==", "pending").Documents(ctx)
	pendingCount := 0
	for {
		_, err := pendingIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		pendingCount++
	}
	pendingIter.Stop()
	stats["pendingSongs"] = pendingCount

	return stats, nil
}
