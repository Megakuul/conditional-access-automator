package main

import (
	"github.com/megakuul/conditional-access-automator/server/adapter"
	"github.com/megakuul/conditional-access-automator/server/api"
)

func main() {
	adapterInstance := adapter.NewAzureAdapter()
	err := adapterInstance.ApplyCond(``, 1734537710)

	if err!=nil {
		panic(err)
	}
	apiInstance := api.NewApi(":8080")
	apiInstance.Serve()
}
