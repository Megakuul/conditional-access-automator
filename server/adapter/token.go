package adapter

import (
	"context"
	"net/http"
	"time"

	"golang.org/x/oauth2"
)

// TokenInjector provides static token source for hashicorp azure sdk
type TokenInjector struct {
	accessToken    string
	expirationDate time.Time
}

func NewTokenInjector(accessToken string, expirationDate int) *TokenInjector {
	return &TokenInjector{
		accessToken:    accessToken,
		expirationDate: time.Unix(int64(expirationDate), 0),
	}
}

func (t *TokenInjector) Token(_ context.Context, _ *http.Request) (*oauth2.Token, error) {
	return &oauth2.Token{
		AccessToken:  t.accessToken,
		RefreshToken: "",
		TokenType:    "Bearer",
		Expiry:       t.expirationDate,
	}, nil
}

func (t *TokenInjector) AuxiliaryTokens(_ context.Context, _ *http.Request) ([]*oauth2.Token, error) {
	return []*oauth2.Token{{
		AccessToken:  t.accessToken,
		RefreshToken: "",
		TokenType:    "Bearer",
		Expiry:       t.expirationDate,
	}}, nil
}
