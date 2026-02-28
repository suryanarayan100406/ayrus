package models

import "time"

type Playlist struct {
	ID        string    `json:"id" firestore:"id"`
	Name      string    `json:"name" firestore:"name"`
	UserID    string    `json:"userId" firestore:"userId"`
	CoverURL  string    `json:"coverURL" firestore:"coverURL"`
	IsPublic  bool      `json:"isPublic" firestore:"isPublic"`
	SongIDs   []string  `json:"songIds" firestore:"songIds"`
	CreatedAt time.Time `json:"createdAt" firestore:"createdAt"`
}

type CreatePlaylistRequest struct {
	Name     string `json:"name" binding:"required"`
	IsPublic bool   `json:"isPublic"`
}

type UpdatePlaylistRequest struct {
	Name     string   `json:"name"`
	IsPublic *bool    `json:"isPublic"`
	SongIDs  []string `json:"songIds"`
}
