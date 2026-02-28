package models

import "time"

type Artist struct {
	UID           string    `json:"uid" firestore:"uid"`
	DisplayName   string    `json:"displayName" firestore:"displayName"`
	Bio           string    `json:"bio" firestore:"bio"`
	PhotoURL      string    `json:"photoURL" firestore:"photoURL"`
	Status        string    `json:"status" firestore:"status"` // pending, approved, rejected
	FollowerCount int       `json:"followerCount" firestore:"followerCount"`
	CreatedAt     time.Time `json:"createdAt" firestore:"createdAt"`
}

type ArtistRegisterRequest struct {
	DisplayName string `json:"displayName" binding:"required"`
	Bio         string `json:"bio"`
}

type ArtistAnalytics struct {
	TotalPlays    int            `json:"totalPlays"`
	TotalSongs    int            `json:"totalSongs"`
	FollowerCount int            `json:"followerCount"`
	TopSongs      []SongWithPlay `json:"topSongs"`
}

type SongWithPlay struct {
	Song      Song `json:"song"`
	PlayCount int  `json:"playCount"`
}
