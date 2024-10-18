package main

import (
	"log"

	"github.com/megakuul/conditional-access-automator/server/api"
)

func main() {
	apiInstance := api.NewApi(":8080")
	if err := apiInstance.Serve(); err!=nil {
		log.Fatal(err)
	}
}
