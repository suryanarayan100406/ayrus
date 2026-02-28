package models

import "time"

type Song struct {
	ID         string    `json:"id" firestore:"id"`
	Title      string    `json:"title" firestore:"title"`
	ArtistID   string    `json:"artistId" firestore:"artistId"`
	ArtistName string    `json:"artistName" firestore:"artistName"`
	AlbumID    string    `json:"albumId" firestore:"albumId"`
	AlbumName  string    `json:"albumName" firestore:"albumName"`
	CoverURL   string    `json:"coverURL" firestore:"coverURL"`
	AudioURL   string    `json:"audioURL" firestore:"audioURL"`
	Source     string    `json:"source" firestore:"source"` // upload, jamendo, fma, ia
	Duration   int       `json:"duration" firestore:"duration"`
	PlayCount  int       `json:"playCount" firestore:"playCount"`
	Genre      string    `json:"genre" firestore:"genre"`
	Status     string    `json:"status" firestore:"status"` // pending, approved, rejected
	Tags       []string  `json:"tags" firestore:"tags"`
	CreatedAt  time.Time `json:"createdAt" firestore:"createdAt"`
}

type UploadSongRequest struct {
	Title    string `json:"title" binding:"required"`
	AlbumID  string `json:"albumId"`
	Genre    string `json:"genre"`
	Duration int    `json:"duration"`
}
