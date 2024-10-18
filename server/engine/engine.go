package engine

import "github.com/microsoftgraph/msgraph-sdk-go/models"

type Template struct {
	
}

func ParseTemplate(body []byte) (*Template, error) {
	return &Template{}, nil
}

func ParseAzureTemplate(body models.ConditionalAccessPolicyable) (*Template, error) {
	return &Template{}, nil
}

func SerializeTemplate(body *Template, format string) ([]byte, error) {
	return []byte("A"), nil
}

func SerializeAzureTemplate(body *Template) (models.ConditionalAccessPolicyable, error) {
	return nil, nil
}
