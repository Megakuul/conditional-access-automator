package engine

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"strconv"

	"github.com/hashicorp/go-azure-sdk/microsoft-graph/common-types/beta"
	"github.com/hashicorp/go-azure-sdk/sdk/nullable"
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
			Type:    USER,
			Name:    account,
		})
	}
}

func ParseTemplate(body []byte) (*Template, error) {
	tmpl := &Template{}

	if err := json.Unmarshal(body, tmpl); err != nil {
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
		if err != nil {
			return nil, err
		}
	case "yaml":
		tmplFormat, err = yaml.Marshal(body)
		if err != nil {
			return nil, err
		}
	case "xml":
		tmplFormat, err = xml.Marshal(body)
		if err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unknown template format: %s", format)
	}

	return tmplFormat, nil
}

func ParseAzureTemplate(body beta.ConditionalAccessPolicy) (*Template, error) {
	bodyImpl := body.ConditionalAccessPolicy()

	action, actionCondition := generateActionCondition(bodyImpl.GrantControls)

	return &Template{
		Id:          safeString(bodyImpl.Id),
		Name:        safeString(bodyImpl.DisplayName),
		Description: safeString(bodyImpl.Description.Get()),
		State:       safeString(bodyImpl.State),
		Policy: Policy{
			Action:          action,
			ActionCondition: actionCondition,
			Entities:        generateEntities(bodyImpl.Conditions),
			Resources:       generateResources(bodyImpl.Conditions),
			Conditions:      generateConditions(bodyImpl.Conditions),
		},
	}, nil
}

func SerializeAzureTemplate(body *Template, emergencyAccount string) (string, beta.ConditionalAccessPolicy, error) {
	excludeEmergencyAccount(body, emergencyAccount)

	azureTmpl := beta.BaseConditionalAccessPolicyImpl{
		Id:          &body.Id,
		DisplayName: &body.Name,
		Description: nullable.Value(body.Description),
		State:       (*beta.ConditionalAccessPolicyState)(&body.State),
	}

	updateActionCondition(azureTmpl.GrantControls, body.Policy.Action, body.Policy.ActionCondition)

	updateEntities(azureTmpl.Conditions, body.Policy.Entities)
	updateResources(azureTmpl.Conditions, body.Policy.Resources)
	updateConditions(azureTmpl.Conditions, body.Policy.Conditions)

	return body.Id, azureTmpl, nil
}
