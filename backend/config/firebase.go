package config

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var (
	FirebaseApp     *firebase.App
	AuthClient      *auth.Client
	FirestoreClient *firestore.Client
	StorageBucket   *storage.BucketHandle
)

func InitFirebase() {
	ctx := context.Background()

	credPath := os.Getenv("FIREBASE_CREDENTIALS")
	if credPath == "" {
		credPath = "serviceAccountKey.json"
	}

	opt := option.WithCredentialsFile(credPath)

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase app: %v", err)
	}
	FirebaseApp = app

	// Initialize Auth client
	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase Auth: %v", err)
	}
	AuthClient = authClient

	// Initialize Firestore client
	fsClient, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalf("Failed to initialize Firestore: %v", err)
	}
	FirestoreClient = fsClient

	// Initialize Storage
	bucketName := os.Getenv("FIREBASE_STORAGE_BUCKET")
	if bucketName == "" {
		log.Println("Warning: FIREBASE_STORAGE_BUCKET not set, storage features will be unavailable")
	} else {
		storageClient, err := storage.NewClient(ctx, opt)
		if err != nil {
			log.Fatalf("Failed to initialize Cloud Storage: %v", err)
		}
		StorageBucket = storageClient.Bucket(bucketName)
	}

	log.Println("✅ Firebase initialized successfully")
}

func CloseFirebase() {
	if FirestoreClient != nil {
		FirestoreClient.Close()
	}
}
