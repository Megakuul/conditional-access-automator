package adapter

import (
	"context"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	msgraph "github.com/microsoftgraph/msgraph-sdk-go"
	"github.com/microsoftgraph/msgraph-sdk-go/models"
)

type AzureAdapter struct {}

func NewAzureAdapter() *AzureAdapter {
	return &AzureAdapter{}
}

func (a *AzureAdapter) FetchPolicies(accessToken string) (models.ConditionalAccessPolicyCollectionResponseable, error) {

		token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed to cast token claims")
	}
	expiration, err := claims.GetExpirationTime()
	if err!=nil {
		return nil, err
	}
	userSub, err := claims.GetSubject()
	if err!=nil {
		return nil, err
	}
	
	graphClient, err := msgraph.NewGraphServiceClientWithCredentials(
		NewTokenInjector(accessToken, expiration.Unix()), []string{"Policy.Read.All"},
	)
	if err!=nil {
		return nil, err
	}

	policies, err := graphClient.Identity().ConditionalAccess().Policies().Get(context.Background(), nil)
	if err != nil {
		return nil, err
	}

	fmt.Printf("INFO: user %s fetched policies\n", userSub)

	return policies, nil
}


func (a *AzureAdapter) UpdatePolicy(
	accessToken string,
	tmpl models.ConditionalAccessPolicyable) (models.ConditionalAccessPolicyable, error) {
	
	token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed to cast token claims")
	}
	expiration, err := claims.GetExpirationTime()
	if err!=nil {
		return nil, err
	}
	userSub, err := claims.GetSubject()
	if err!=nil {
		return nil, err
	}
	
	graphClient, err := msgraph.NewGraphServiceClientWithCredentials(
		NewTokenInjector(accessToken, expiration.Unix()), []string{"Policy.Read.All", "Policy.ReadWrite.ConditionalAccess"},
	)
	if err!=nil {
		return nil, err
	}

	tmplId := ""
	if tmpl.GetId() != nil {
		tmplId = *tmpl.GetId()
	}

	policy, err := graphClient.Identity().ConditionalAccess().Policies().ByConditionalAccessPolicyId(tmplId).Get(
		context.Background(), nil,
	)
	if err!=nil {
		// TODO
		requestBody := models.NewConditionalAccessPolicy()
		displayName := "Access to EXO requires MFA"
		requestBody.SetDisplayName(&displayName) 
		state := models.ENABLED_CONDITIONALACCESSPOLICYSTATE 
		requestBody.SetState(&state) 
		conditions := models.NewConditionalAccessConditionSet()

		applications := models.NewConditionalAccessApplications()
		includeApplications := []string{
			"00000002-0000-0ff1-ce00-000000000000",
		}
		applications.SetIncludeApplications(includeApplications)
		conditions.SetApplications(applications)

		users := models.NewConditionalAccessUsers()
		includeGroups := []string{
			"ba8e7ded-8b0f-4836-ba06-8ff1ecc5c8ba",
		}
		users.SetIncludeGroups(includeGroups)
		conditions.SetUsers(users)

		locations := models.NewConditionalAccessLocations()
		includeLocations := []string{
			"All",
		}
		locations.SetIncludeLocations(includeLocations)

		excludeLocations := []string{
			"AllTrusted",
		}
		locations.SetExcludeLocations(excludeLocations)
		conditions.SetLocations(locations)

		requestBody.SetConditions(conditions)

		grantControls := models.NewConditionalAccessGrantControls()
		operator := "OR"
		grantControls.SetOperator(&operator)


		requestBody.SetGrantControls(grantControls)

		// TODO
		
		policy, err = graphClient.Identity().ConditionalAccess().Policies().Post(
			context.Background(), requestBody, nil,
		)
		if err != nil {
			return nil, err
		}
	} else {
		policy, err = graphClient.Identity().ConditionalAccess().Policies().ByConditionalAccessPolicyId(tmplId).Patch(
			context.Background(), tmpl, nil,
		)
		if err != nil {
			return nil, err
		}
	}

	if policy.GetDisplayName() != nil {
		fmt.Printf("INFO: user %s updated policy %s\n", userSub, *policy.GetDisplayName())
	} else if policy.GetId() != nil {
		fmt.Printf("INFO: user %s updated policy %s\n", userSub, *policy.GetId())
	}

	return policy, nil
}


func (a *AzureAdapter) DeletePolicy(accessToken string, policyId string) error {
	
	token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return fmt.Errorf("failed to cast token claims")
	}
	expiration, err := claims.GetExpirationTime()
	if err!=nil {
		return err
	}
	userSub, err := claims.GetSubject()
	if err!=nil {
		return err
	}
	
	graphClient, err := msgraph.NewGraphServiceClientWithCredentials(
		NewTokenInjector(accessToken, expiration.Unix()), []string{"Policy.Write.All"},
	)
	if err!=nil {
		return err
	}

	err = graphClient.Identity().ConditionalAccess().Policies().ByConditionalAccessPolicyId(policyId).Delete(
		context.Background(), nil,
	)
	if err != nil {
		return err
	}

	fmt.Printf("INFO: user %s deleted policy %s\n", userSub, policyId)

	return nil
}
