package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/megakuul/conditional-access-automator/server/api"
)

func main() {

	
	const access_token = `eyJ0eXAiOiJKV1QiLCJub25jZSI6IktYWWRBMjl4U0RLUlJaWmNMUE1IVDhFMXAwa0syUC1PMnQ1OGJEZnVjRGMiLCJhbGciOiJSUzI1NiIsIng1dCI6IjNQYUs0RWZ5Qk5RdTNDdGpZc2EzWW1oUTVFMCIsImtpZCI6IjNQYUs0RWZ5Qk5RdTNDdGpZc2EzWW1oUTVFMCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9lYWIxMjk4ZC1lNjE5LTRkNGMtOTgwNC1iMDI4YTBkOTdlNTIvIiwiaWF0IjoxNzI5MzI0ODY5LCJuYmYiOjE3MjkzMjQ4NjksImV4cCI6MTcyOTMyOTMzMywiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFUUUF5LzhZQUFBQWdWWitZUkl1SXRnc0tCblNnRzdoK1lneUhEM003bjJqSzhXb1ZMOGxacVNIUmFpRys5Mm9mUGs1MDZGOHVpeUsiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6InRlc3QiLCJhcHBpZCI6Ijg3MGVhNzUxLWNiNDktNGMzYi04MjJlLWVjMzFlZTY2NWZmYSIsImFwcGlkYWNyIjoiMSIsImlkdHlwIjoidXNlciIsImlwYWRkciI6IjJhMDI6MTM2ODo3MDBjOjA6YWQ2Zjo0ODg1OmU4MDA6ZTY4MSIsIm5hbWUiOiJzYWxhdGJydW5uZSIsIm9pZCI6IjNkY2I0YTgxLTNhNTUtNDU3OC1iNmY1LTVkNTcxOTQxMGI1NSIsInBsYXRmIjoiMyIsInB1aWQiOiIxMDAzMjAwM0U0QzgyMUM4IiwicmgiOiIwLkFSTUJqU214NmhubVRFMllCTEFvb05sLVVnTUFBQUFBQUFBQXdBQUFBQUFBQUFBVUFmSS4iLCJzY3AiOiJvcGVuaWQgUG9saWN5LlJlYWQuQWxsIFBvbGljeS5SZWFkV3JpdGUuQ29uZGl0aW9uYWxBY2Nlc3MgcHJvZmlsZSBVc2VyLlJlYWQgZW1haWwiLCJzdWIiOiJFVjF0Nks3c1BoMlJuckZJbXFQMUFFT2hfd3FRT2dYSkpSdFRXbkxFck5BIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6IkVVIiwidGlkIjoiZWFiMTI5OGQtZTYxOS00ZDRjLTk4MDQtYjAyOGEwZDk3ZTUyIiwidW5pcXVlX25hbWUiOiJzYWxhdGJydW5uZUB5b3VuZ3RhbGVudHMyLm9ubWljcm9zb2Z0LmNvbSIsInVwbiI6InNhbGF0YnJ1bm5lQHlvdW5ndGFsZW50czIub25taWNyb3NvZnQuY29tIiwidXRpIjoiaFRFbzNGR1hPRTI2M1pOT29HeWlBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiNjJlOTAzOTQtNjlmNS00MjM3LTkxOTAtMDEyMTc3MTQ1ZTEwIiwiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il0sInhtc19pZHJlbCI6IjEgMjQiLCJ4bXNfc3QiOnsic3ViIjoiQmMwLWwzeWRVenQyN2VKaTRaZXJPWDFwS1BnLVBreWsxMHFtX0RYak9KMCJ9LCJ4bXNfdGNkdCI6MTcyOTE2NzQ0MywieG1zX3RkYnIiOiJFVSJ9.VAGBIvXEqX5w0F1dY08BZ8BTzlPezIBM-Lb8k33csOsNpAJsKvAcOQnx9cX-dxbiQaxGT3EA0U6bTnZHIYHphRNbF2BzzV13XhuDd2Ev-30-PVQLoxUGXDE4KZWVosuAnT84XzcjanN-Pioq90NoN_vFEzilQrblkkEDbJqLpVYuIksA98-HKei9d3gVntP1UZrAK5uYn-u8x-2vDxdqYUSHhpY_UXiM93YsBO71kNPS4qRcIbNAa4sp2ixKxTwH9iGl-MGubwodwxZR0dx-jsUHznMQrfoK-1r_9ja8UGH457RUOFWqeaMYyGObjjoT-zygEeg5J7WqimqpE8Nezw`
	
policy := map[string]interface{}{
    "displayName": "Block legacy authentication",
    "state":       "enabled",
    "conditions": map[string]interface{}{
        "users": map[string]interface{}{
            "includeUsers": []string{"All"}, // Valid value for users
        },
        "applications": map[string]interface{}{
            "includeApplications": []string{"All"}, // Valid value for applications
        },
        "platforms": map[string]interface{}{
            "includePlatforms": []string{"All"}, // Valid platform value
        },
    },
    "grantControls": map[string]interface{}{
        "operator":       "OR",
        "builtInControls": []string{"mfa"},
    },
}


	// Convert policy to JSON
	policyBody, err := json.Marshal(policy)
	if err != nil {
		log.Fatalf("Failed to marshal policy: %v", err)
	}

	// Send the POST request
	url := "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(policyBody))
	if err != nil {
		log.Fatalf("Failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+access_token)
	req.Header.Set("Content-Type", "application/json")

	// Send request and handle response
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// Read and print response
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(body))

	
	if len(os.Args) != 3  {
		log.Fatal("Usage: caa-engine [listener_addr] [emergency_account_id]")
	}
	apiInstance := api.NewApi(os.Args[1], os.Args[2])
	fmt.Printf("serving caa-engine on %s... \n", os.Args[1])
	if err := apiInstance.Serve(); err!=nil {
		log.Fatal(err)
	}
}
