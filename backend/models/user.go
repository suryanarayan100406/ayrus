package models

import "time"

type User struct {
	UID            string    `json:"uid" firestore:"uid"`
	Email          string    `json:"email" firestore:"email"`
	DisplayName    string    `json:"displayName" firestore:"displayName"`
	PhotoURL       string    `json:"photoURL" firestore:"photoURL"`
	Role           string    `json:"role" firestore:"role"` // user, artist, admin
	LikedSongs     []string  `json:"likedSongs" firestore:"likedSongs"`
	Following      []string  `json:"following" firestore:"following"`
	RecentlyPlayed []string  `json:"recentlyPlayed" firestore:"recentlyPlayed"`
	CreatedAt      time.Time `json:"createdAt" firestore:"createdAt"`
}

type UpdateUserRequest struct {
	DisplayName string `json:"displayName"`
	PhotoURL    string `json:"photoURL"`
}
