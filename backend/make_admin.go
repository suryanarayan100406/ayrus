//go:build ignore

package main

import (
	"context"
	"fmt"
	"log"
	
	"spotify-clone/config"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

func main() {
	config.InitFirebase()

	ctx := context.Background()
	iter := config.FirestoreClient.Collection("users").Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Fatalf("Failed to iterate: %v", err)
		}

		_, err = doc.Ref.Update(ctx, []firestore.Update{
			{Path: "role", Value: "admin"},
		})
		if err != nil {
			log.Printf("Failed to update user %s: %v", doc.Ref.ID, err)
		} else {
			fmt.Printf("Updated user %s to admin role\n", doc.Ref.ID)
		}
	}
	fmt.Println("All users updated to admin!")
}
