package main

import (
	"fmt"
	"log"
	"os"

	"github.com/megakuul/conditional-access-automator/server/api"
)

func main() {
	if len(os.Args) != 3 {
		log.Fatal("Usage: caa-server [listener_addr] [emergency_account_id]\n")
	}
	apiInstance := api.NewApi(os.Args[1], os.Args[2])
	fmt.Printf("serving caa-server on %s... \n", os.Args[1])
	if err := apiInstance.Serve(); err != nil {
		log.Fatal(err)
	}
}
