package adapter

import (
	"context"
	"fmt"
	
	msgraph "github.com/microsoftgraph/msgraph-sdk-go"
)

type AzureAdapter struct {
	
}

func NewAzureAdapter() *AzureAdapter {
	return &AzureAdapter{}
}

func (a *AzureAdapter) ApplyCond(accessToken string, accessTokenExp int64) error {
	graphClient, err := msgraph.NewGraphServiceClientWithCredentials(
		NewTokenInjector(accessToken, accessTokenExp), []string{"Policy.ReadWrite.ConditionalAccess", "Policy.Read.All"},
	)
	if err!=nil {
		return err
	}

	policies, err := graphClient.Identity().ConditionalAccess().Policies().Get(context.Background(), nil)
	if err != nil {
		return err
	}

	for _, policy := range policies.GetValue() {
		fmt.Println(*policy.GetDisplayName())
	}

	return nil
}
