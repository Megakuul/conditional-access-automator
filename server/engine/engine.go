package engine

import (
	"encoding/json"
	"encoding/xml"
	"fmt"

	"github.com/microsoftgraph/msgraph-sdk-go/models"
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


func ParseAzureTemplate(body models.ConditionalAccessPolicyable) (*Template, error) {
	action, actionCondition := generateActionCondition(body.GetGrantControls())
	
	return &Template{
		Id: safeString(body.GetId()),
		Name: safeString(body.GetDisplayName()),
		Description: safeString(body.GetDescription()),
		State: STATE_TYPE(*body.GetState()),
		Policy: Policy{
			Action: action,
			ActionCondition: actionCondition,
			Entities: generateEntities(body.GetConditions()),
			Resources: generateResources(body.GetConditions()),
			Conditions: generateConditions(body.GetConditions()),
		},
	}, nil
}


func SerializeAzureTemplate(body *Template, emergencyAccount string) (models.ConditionalAccessPolicyable, error) {
	excludeEmergencyAccount(body, emergencyAccount)
	
	azureTmpl := models.NewConditionalAccessPolicy()
	azureTmpl.SetId(&body.Id)
	azureTmpl.SetDisplayName(&body.Name)
	azureTmpl.SetDescription(&body.Description)
	
	var status models.ConditionalAccessPolicyState = models.ConditionalAccessPolicyState(body.State)
	azureTmpl.SetState(&status)

	updateActionCondition(azureTmpl.GetGrantControls(), body.Policy.Action, body.Policy.ActionCondition)
	
	updateEntities(azureTmpl.GetConditions(), body.Policy.Entities)
	updateResources(azureTmpl.GetConditions(), body.Policy.Resources)
	updateConditions(azureTmpl.GetConditions(), body.Policy.Conditions)

	return nil, nil
}
