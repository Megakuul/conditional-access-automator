package engine

type Template struct {
	Id          string     `yaml:"id" json:"id" xml:"id"`
	Name        string     `yaml:"name" json:"name" xml:"name"`
	Description string     `yaml:"description" json:"description" xml:"description"`
	State       string `yaml:"state" json:"state" xml:"state"`
	Policy      Policy     `yaml:"policy" json:"policy" xml:"policy"`
}

type Grant struct {
	AllowedCombinations string `yaml:"allowed_combinations" json:"allowed_combinations" xml:"allowed_combinations"`
}

type Policy struct {
	Action          bool            `yaml:"action" json:"action" xml:"action"`
	ActionCondition ActionCondition `yaml:"action_condition" json:"action_condition" xml:"action_condition"`
	Entities        []Entity        `yaml:"entities" json:"entities" xml:"entities"`
	Resources       []Resource      `yaml:"resources" json:"resources" xml:"resources"`
	Conditions      []Condition     `yaml:"conditions" json:"conditions" xml:"conditions"`
}

type ACTION_CONDITION int64

const (
	MFA ACTION_CONDITION = iota
	COMPLIANT_CLIENT
	DOMAINJOINED_CLIENT
	APPROVED_APP
	COMPLIANT_APP
	PASSWORDCHANGE
)

type ActionCondition struct {
	ChainOperator string             `yaml:"chain_operator" json:"chain_operator" xml:"chain_operator"`
	Conditions    []ACTION_CONDITION `yaml:"conditions" json:"conditions" xml:"conditions"`
}

type ENTITY_TYPE int64

const (
	USER ENTITY_TYPE = iota
	GROUP
	ROLE
)

type Entity struct {
	Include bool        `yaml:"include" json:"include" xml:"include"`
	Type    ENTITY_TYPE `yaml:"entity_type" json:"entity_type" xml:"entity_type"`
	Name    string      `yaml:"name" json:"name" xml:"name"`
}

type RESOURCE_TYPE int64

const (
	APP RESOURCE_TYPE = iota
)

type Resource struct {
	Include bool          `yaml:"include" json:"include" xml:"include"`
	Type    RESOURCE_TYPE `yaml:"resource_type" json:"resource_type" xml:"resource_type"`
	Name    string        `yaml:"name" json:"name" xml:"name"`
}

type CONDITION_TYPE int64

const (
	PLATFORM CONDITION_TYPE = iota
	LOCATION
	CLIENT_APP
)

type Condition struct {
	Include bool           `yaml:"include" json:"include" xml:"include"`
	Type    CONDITION_TYPE `yaml:"condition_type" json:"condition_type" xml:"condition_type"`
	Name    string         `yaml:"name" json:"name" xml:"name"`
}
