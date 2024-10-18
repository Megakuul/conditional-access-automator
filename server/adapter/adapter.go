package adapter

import (
	"context"

	msgraph "github.com/microsoftgraph/msgraph-sdk-go"
	"github.com/microsoftgraph/msgraph-sdk-go/models"
)

type AzureAdapter struct {}

func NewAzureAdapter() *AzureAdapter {
	return &AzureAdapter{}
}

func (a *AzureAdapter) FetchPolicies(
	accessToken string,
	accessTokenExp int) (models.ConditionalAccessPolicyCollectionResponseable, error) {
	
	graphClient, err := msgraph.NewGraphServiceClientWithCredentials(
		NewTokenInjector(accessToken, accessTokenExp), []string{"Policy.Read.All"},
	)
	if err!=nil {
		return nil, err
	}

	policies, err := graphClient.Identity().ConditionalAccess().Policies().Get(context.Background(), nil)
	if err != nil {
		return nil, err
	}

	return policies, nil
}


func (a *AzureAdapter) UpdatePolicy(
	accessToken string,
	accessTokenExp int,
	tmpl models.ConditionalAccessPolicyable) (models.ConditionalAccessPolicyable, error) {

	graphClient, err := msgraph.NewGraphServiceClientWithCredentials(
		NewTokenInjector(accessToken, accessTokenExp), []string{"Policy.Write.All"},
	)
	if err!=nil {
		return nil, err
	}

	policy, err := graphClient.Identity().ConditionalAccess().Policies().Post(
		context.Background(), tmpl, nil,
	)
	if err != nil {
		return nil, err
	}

	return policy, nil
}
