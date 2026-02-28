package models

import "time"

type Album struct {
	ID        string    `json:"id" firestore:"id"`
	Title     string    `json:"title" firestore:"title"`
	ArtistID  string    `json:"artistId" firestore:"artistId"`
	CoverURL  string    `json:"coverURL" firestore:"coverURL"`
	Year      int       `json:"year" firestore:"year"`
	SongCount int       `json:"songCount" firestore:"songCount"`
	CreatedAt time.Time `json:"createdAt" firestore:"createdAt"`
}

type CreateAlbumRequest struct {
	Title string `json:"title" binding:"required"`
	Year  int    `json:"year"`
}
