package engine

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"strconv"

	"gopkg.in/yaml.v3"
)

func safeString(s interface{}) string {
	str, ok := s.(string)
	if ok {
		return str
	}
	return ""
}

func safeInt(i interface{}, def int) int {
	switch v := i.(type) {
	case int:
		return v
	case string:
		if intValue, err := strconv.Atoi(v); err == nil {
			return intValue
		}
	default:
		return def
	}
	return def
}

func excludeEmergencyAccount(body *Template, account string) {
	if !body.Policy.Action {
		for _, entity := range body.Policy.Entities {
			if entity.Name == account && !entity.Include {
				return
			}
		}
		body.Policy.Entities = append(body.Policy.Entities, Entity{
			Include: false,
			Type: USER,
			Name: account,
		})
	}
}

func ParseTemplate(body []byte) (*Template, error) {
	tmpl := &Template{}

	if err:=json.Unmarshal(body, tmpl); err!=nil {
		return nil, err
	}
	return tmpl, nil
}

func SerializeTemplate(body *Template, format, emergencyAccount string) ([]byte, error) {
	excludeEmergencyAccount(body, emergencyAccount)
	
	var err error
	tmplFormat := []byte{}

	switch format {
	case "json":
		tmplFormat, err = json.Marshal(body)
		if err!=nil {
			return nil, err
		}
	case "yaml":
		tmplFormat, err = yaml.Marshal(body)
		if err!=nil {
			return nil, err
		}
	case "xml":
		tmplFormat, err = xml.Marshal(body)
		if err!=nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unknown template format: %s", format)
	}
	
	return tmplFormat, nil
}

// ParseAzureTemplate parses the Azure policy from byte slice map
func ParseAzureTemplate(bodyMap map[string]interface{}) (*Template, error) {

	
	action, actionCondition := generateActionCondition(bodyMap["grantControls"])

	return &Template{
		Id:          safeString(bodyMap["id"]),
		Name:        safeString(bodyMap["displayName"]),
		Description: safeString(bodyMap["description"]),
		State:       safeString(bodyMap["state"]),
		Policy: Policy{
			Action:          action,
			ActionCondition: actionCondition,
			Entities:        generateEntities(bodyMap["conditions"]),
			Resources:       generateResources(bodyMap["conditions"]),
			Conditions:      generateConditions(bodyMap["conditions"]),
		},
	}, nil
}

// SerializeAzureTemplate serializes the Template into a byte slice for Azure policy
func SerializeAzureTemplate(body *Template, emergencyAccount string) (string, []byte, error) {
	excludeEmergencyAccount(body, emergencyAccount)

	azureTmpl := make(map[string]interface{})
	azureTmpl["id"] = body.Id
	azureTmpl["displayName"] = body.Name
	azureTmpl["description"] = body.Description
	azureTmpl["state"] = body.State

	grant := make(map[string]interface{})
	updateActionCondition(grant, body.Policy.Action, body.Policy.ActionCondition)
	azureTmpl["grantControls"] = grant

	conditions := make(map[string]interface{})
	updateEntities(conditions, body.Policy.Entities)
	updateResources(conditions, body.Policy.Resources)
	updateConditions(conditions, body.Policy.Conditions)
	azureTmpl["conditions"] = conditions

	outTmpl, err := json.Marshal(azureTmpl)
	if err!=nil {
		return "", nil, err
	}
	fmt.Println(string(outTmpl))
	return body.Id, outTmpl, nil
}
