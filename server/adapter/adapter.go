package adapter

import (
	"context"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/hashicorp/go-azure-sdk/microsoft-graph/common-types/beta"
	"github.com/hashicorp/go-azure-sdk/microsoft-graph/policies/beta/conditionalaccesspolicy"
	"github.com/hashicorp/go-azure-sdk/sdk/environments"
)

type AzureAdapter struct{}

func NewAzureAdapter() *AzureAdapter {
	return &AzureAdapter{}
}

func (a *AzureAdapter) FetchPolicies(accessToken string) (*[]beta.ConditionalAccessPolicy, error) {

	token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed to cast token claims")
	}
	userSub, err := claims.GetSubject()
	if err != nil {
		return nil, err
	}
	accessTokenExp, err := claims.GetExpirationTime()
	if err != nil {
		return nil, err
	}

	client, err := conditionalaccesspolicy.NewConditionalAccessPolicyClientWithBaseURI(environments.AzurePublic().MicrosoftGraph)
	if err != nil {
		return nil, err
	}
	client.Client.SetAuthorizer(NewTokenInjector(accessToken, int(accessTokenExp.Unix())))

	resp, err := client.ListConditionalAccessPolicies(context.TODO(), conditionalaccesspolicy.DefaultListConditionalAccessPoliciesOperationOptions())
	if err != nil {
		return nil, err
	}

	fmt.Printf("INFO: user %s fetched all policies", userSub)

	return resp.Model, nil
}

func (a *AzureAdapter) UpdatePolicy(accessToken string, tmplId string, tmpl beta.ConditionalAccessPolicy) error {
	token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return fmt.Errorf("failed to cast token claims")
	}
	userSub, err := claims.GetSubject()
	if err != nil {
		return err
	}
	accessTokenExp, err := claims.GetExpirationTime()
	if err != nil {
		return err
	}

	client, err := conditionalaccesspolicy.NewConditionalAccessPolicyClientWithBaseURI(environments.AzurePublic().MicrosoftGraph)
	if err != nil {
		return err
	}
	client.Client.SetAuthorizer(NewTokenInjector(accessToken, int(accessTokenExp.Unix())))

	_, err = client.CreateConditionalAccessPolicy(context.TODO(),
		tmpl,
		conditionalaccesspolicy.DefaultCreateConditionalAccessPolicyOperationOptions(),
	)
	if err != nil {
		_, err = client.UpdateConditionalAccessPolicy(context.TODO(),
			beta.NewPolicyConditionalAccessPolicyID(tmplId),
			tmpl,
			conditionalaccesspolicy.DefaultUpdateConditionalAccessPolicyOperationOptions(),
		)
		if err != nil {
			return err
		}
	}

	fmt.Printf("INFO: user %s updated policy %s\n", userSub, tmplId)

	return nil
}

func (a *AzureAdapter) DeletePolicy(accessToken string, tmplId string) error {
	token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return fmt.Errorf("failed to cast token claims")
	}
	userSub, err := claims.GetSubject()
	if err != nil {
		return err
	}
	accessTokenExp, err := claims.GetExpirationTime()
	if err != nil {
		return err
	}

	client, err := conditionalaccesspolicy.NewConditionalAccessPolicyClientWithBaseURI(environments.AzurePublic().MicrosoftGraph)
	if err != nil {
		return err
	}
	client.Client.SetAuthorizer(NewTokenInjector(accessToken, int(accessTokenExp.Unix())))

	_, err = client.DeleteConditionalAccessPolicy(context.TODO(),
		beta.NewPolicyConditionalAccessPolicyID(tmplId),
		conditionalaccesspolicy.DefaultDeleteConditionalAccessPolicyOperationOptions(),
	)

	fmt.Printf("INFO: user %s deleted policy %s\n", userSub, tmplId)

	return nil
}
