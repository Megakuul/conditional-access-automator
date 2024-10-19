package engine

import (
	"encoding/json"
	"encoding/xml"
	"fmt"

	"gopkg.in/yaml.v3"
)

func safeString(s *string) string {
    if s == nil {
        return ""
    }
    return *s
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
	
	action, actionCondition := generateActionCondition(bodyMap["grantControls"].(map[string]interface{}))

	return &Template{
		Id:          safeString(bodyMap["id"].(*string)),
		Name:        safeString(bodyMap["displayName"].(*string)),
		Description: safeString(bodyMap["description"].(*string)),
		State:       STATE_TYPE(bodyMap["state"].(int)),
		Policy: Policy{
			Action:          action,
			ActionCondition: actionCondition,
			Entities:        generateEntities(bodyMap["conditions"].(map[string]interface{})),
			Resources:       generateResources(bodyMap["conditions"].(map[string]interface{})),
			Conditions:      generateConditions(bodyMap["conditions"].(map[string]interface{})),
		},
	}, nil
}

// SerializeAzureTemplate serializes the Template into a byte slice for Azure policy
func SerializeAzureTemplate(body *Template, emergencyAccount string) (string, []byte, error) {
	excludeEmergencyAccount(body, emergencyAccount)

	azureTmpl := make(map[string]interface{})
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
	return body.Id, outTmpl, nil
}
