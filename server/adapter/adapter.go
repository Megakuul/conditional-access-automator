package adapter

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

type AzureAdapter struct {}

func NewAzureAdapter() *AzureAdapter {
	return &AzureAdapter{}
}

func (a *AzureAdapter) FetchPolicies(accessToken string) ([]map[string]interface{}, error) {

	token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed to cast token claims")
	}
	userSub, err := claims.GetSubject()
	if err!=nil {
		return nil, err
	}

	url := "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err!=nil {
		return nil, err
	}

	fmt.Printf("INFO: user %s fetched policies\n", userSub)

	bodyMap := map[string]interface{}{}
	err = json.Unmarshal(body, &bodyMap)
	if err!=nil {
		return nil, err
	}
	bodyValues, ok := bodyMap["value"].([]interface{})
	if !ok {
    return nil, fmt.Errorf(string(body))
	}

	var bodyMaps []map[string]interface{}
	for _, value := range bodyValues {
    if item, ok := value.(map[string]interface{}); ok {
			bodyMaps = append(bodyMaps, item)
    } else {
			return nil, fmt.Errorf("unexpected type in value slice")
    }
	}

	return bodyMaps, nil
}


func (a *AzureAdapter) UpdatePolicy(accessToken string, tmplId string, tmpl []byte) (map[string]interface{}, error) {

	token, _, err := new(jwt.Parser).ParseUnverified(accessToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed to cast token claims")
	}
	userSub, err := claims.GetSubject()
	if err!=nil {
		return nil, err
	}

	url := "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(tmpl))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err!=nil {
		return nil, err
	}

	fmt.Printf("INFO: user %s updated policy %s\n", userSub, tmplId)

	bodyMap := map[string]interface{}{}
	err = json.Unmarshal(body, &bodyMap)
	if err!=nil {
		return nil, err
	}
	return bodyMap, nil
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
	if err!=nil {
		return err
	}
	
	url := "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/" + tmplId
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return  err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	_, err = io.ReadAll(resp.Body)
	if err!=nil {
		return err
	}

	fmt.Printf("INFO: user %s deleted policy %s\n", userSub, tmplId)

	return nil
}
