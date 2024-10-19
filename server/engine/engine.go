package engine

import (
	"encoding/json"
	"encoding/xml"
	"fmt"

	"github.com/microsoftgraph/msgraph-sdk-go/models"
	"gopkg.in/yaml.v3"
)

func ParseTemplate(body []byte) (*Template, error) {
	tmpl := &Template{}

	if err:=json.Unmarshal(body, tmpl); err!=nil {
		return nil, err
	}
	return tmpl, nil
}

func SerializeTemplate(body *Template, format string) ([]byte, error) {
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

func safeString(s *string) string {
    if s == nil {
        return ""
    }
    return *s
}


func ParseAzureTemplate(body models.ConditionalAccessPolicyable) (*Template, error) {
	fmt.Println(body.GetBackingStore())
	return &Template{
		Id: safeString(body.GetId()),
		Name: safeString(body.GetDisplayName()),
		Description: safeString(body.GetDescription()),
		State: "salami",
		Grant: Grant{ AllowedCombinations: "" },
		Policy: Policy{
			Action: true,
			Entities: generateEntities(body.GetConditions()),
			Resources: generateResources(body.GetConditions()),
			Conditions: generateConditions(body.GetConditions()),
		},
	}, nil
}


func SerializeAzureTemplate(body *Template) (models.ConditionalAccessPolicyable, error) {
	azureTmpl := models.NewConditionalAccessPolicy()
	azureTmpl.SetId(&body.Id)
	azureTmpl.SetDisplayName(&body.Name)
	azureTmpl.SetDescription(&body.Description)
	var STATUS models.ConditionalAccessPolicyState = 0
	azureTmpl.SetState(&STATUS)

	updateEntities(azureTmpl.GetConditions(), body.Policy.Entities)
	updateResources(azureTmpl.GetConditions(), body.Policy.Resources)
	updateConditions(azureTmpl.GetConditions(), body.Policy.Conditions)

	return nil, nil
}
