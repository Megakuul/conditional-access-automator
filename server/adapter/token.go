package adapter

import (
	"context"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/policy"
)

// TokenInjector provides static token source for oauth access token
// This is used because azure sdk does not support go:
// https://learn.microsoft.com/en-us/graph/sdks/choose-authentication-providers?tabs=go#authorization-code-provider
type TokenInjector struct {
	accessToken    string
	expirationDate time.Time
}

func NewTokenInjector(accessToken string, expirationDate int) *TokenInjector {
	return &TokenInjector{
		accessToken: accessToken,
		expirationDate: time.Unix(int64(expirationDate), 0),
	}
}

func (t *TokenInjector) GetToken(ctx context.Context, _ policy.TokenRequestOptions) (azcore.AccessToken, error) {
	return azcore.AccessToken{
		Token:     t.accessToken,
		ExpiresOn: t.expirationDate,
	}, nil
}
