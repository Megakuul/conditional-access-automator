package engine

import (
	beta "github.com/hashicorp/go-azure-sdk/microsoft-graph/common-types/beta"
	"github.com/hashicorp/go-azure-sdk/sdk/nullable"
)

func generateActionCondition(grant *beta.ConditionalAccessGrantControls) (bool, ActionCondition) {
	action := false
	actionCondition := ActionCondition{}

	if grant != nil && grant.Operator != nil {
		action = true
		actionCondition.ChainOperator = *grant.Operator.Get()
		for _, condition := range *grant.BuiltInControls {
			actionCondition.Conditions = append(actionCondition.Conditions, ACTION_CONDITION(stringToGrantControl(condition)))
		}
	}

	return action, actionCondition
}

func stringToGrantControl(grantControl beta.ConditionalAccessGrantControl) ACTION_CONDITION {
	switch grantControl {
	case beta.ConditionalAccessGrantControl_Mfa:
		return MFA
	case beta.ConditionalAccessGrantControl_CompliantDevice:
		return COMPLIANT_CLIENT
	case beta.ConditionalAccessGrantControl_DomainJoinedDevice:
		return DOMAINJOINED_CLIENT
	case beta.ConditionalAccessGrantControl_ApprovedApplication:
		return APPROVED_APP
	case beta.ConditionalAccessGrantControl_CompliantApplication:
		return COMPLIANT_APP
	case beta.ConditionalAccessGrantControl_PasswordChange:
		return PASSWORDCHANGE
	default:
		return -1
	}
}

func generateEntities(cond *beta.ConditionalAccessConditionSet) []Entity {
	entities := []Entity{}

	if cond != nil && cond.Users != nil {
		users := cond.Users

		if users.ExcludeUsers != nil {
			for _, entity := range *users.ExcludeUsers {
				entities = append(entities, Entity{
					Include: false,
					Type:    USER,
					Name:    entity,
				})
			}
		}

		if users.IncludeUsers != nil {
			for _, entity := range *users.IncludeUsers {
				entities = append(entities, Entity{
					Include: true,
					Type:    USER,
					Name:    entity,
				})
			}
		}

		if users.ExcludeGroups != nil {
			for _, entity := range *users.ExcludeGroups {
				entities = append(entities, Entity{
					Include: false,
					Type:    GROUP,
					Name:    entity,
				})
			}
		}

		if users.IncludeGroups != nil {
			for _, entity := range *users.IncludeGroups {
				entities = append(entities, Entity{
					Include: true,
					Type:    GROUP,
					Name:    entity,
				})
			}
		}

		if users.ExcludeRoles != nil {
			for _, entity := range *users.ExcludeRoles {
				entities = append(entities, Entity{
					Include: false,
					Type:    ROLE,
					Name:    entity,
				})
			}
		}

		if users.IncludeRoles != nil {
			for _, entity := range *users.IncludeRoles {
				entities = append(entities, Entity{
					Include: true,
					Type:    ROLE,
					Name:    entity,
				})
			}
		}
	}

	return entities
}

func generateResources(cond *beta.ConditionalAccessConditionSet) []Resource {
	resources := []Resource{}

	if cond != nil && cond.Applications.ExcludeApplications != nil {
		for _, resource := range *cond.Applications.ExcludeApplications {
			resources = append(resources, Resource{
				Include: false,
				Type:    APP,
				Name:    resource,
			})
		}
	}

	if cond.Applications.IncludeApplications != nil {
		for _, resource := range *cond.Applications.IncludeApplications {
			resources = append(resources, Resource{
				Include: true,
				Type:    APP,
				Name:    resource,
			})
		}
	}

	return resources
}

func generateConditions(cond *beta.ConditionalAccessConditionSet) []Condition {
	conditions := []Condition{}

	if cond != nil && cond.Platforms != nil {
		platforms := cond.Platforms

		if platforms.ExcludePlatforms != nil {
			for _, platform := range *platforms.ExcludePlatforms {
				conditions = append(conditions, Condition{
					Include: false,
					Type:    PLATFORM,
					Name:    string(platform),
				})
			}
		}

		if platforms.IncludePlatforms != nil {
			for _, platform := range *platforms.IncludePlatforms {
				conditions = append(conditions, Condition{
					Include: true,
					Type:    PLATFORM,
					Name:    string(platform),
				})
			}
		}
	}

	if cond.Locations != nil {
		locations := cond.Locations

		if locations.ExcludeLocations != nil {
			for _, location := range *locations.ExcludeLocations {
				conditions = append(conditions, Condition{
					Include: false,
					Type:    LOCATION,
					Name:    location,
				})
			}
		}

		if locations.IncludeLocations != nil {
			for _, location := range *locations.IncludeLocations {
				conditions = append(conditions, Condition{
					Include: true,
					Type:    LOCATION,
					Name:    location,
				})
			}
		}
	}

	if cond.ClientAppTypes != nil {
		for _, clientapp := range cond.ClientAppTypes {
			conditions = append(conditions, Condition{
				Include: true,
				Type:    CLIENT_APP,
				Name:    string(clientapp),
			})
		}
	}

	return conditions
}

func updateActionCondition(grant *beta.ConditionalAccessGrantControls, action bool, actionCondition ActionCondition) {
	if action {
		grant.Operator = nullable.Value(actionCondition.ChainOperator)
		conditions := []beta.ConditionalAccessGrantControl{}
		for _, condition := range actionCondition.Conditions {
			conditions = append(conditions, grantControlToString(condition))
		}
		grant.BuiltInControls = &conditions
	}
}

func grantControlToString(actionCondition ACTION_CONDITION) beta.ConditionalAccessGrantControl {
	switch actionCondition {
	case MFA:
		return beta.ConditionalAccessGrantControl_Mfa
	case COMPLIANT_CLIENT:
		return beta.ConditionalAccessGrantControl_CompliantDevice
	case DOMAINJOINED_CLIENT:
		return beta.ConditionalAccessGrantControl_DomainJoinedDevice
	case APPROVED_APP:
		return beta.ConditionalAccessGrantControl_ApprovedApplication
	case COMPLIANT_APP:
		return beta.ConditionalAccessGrantControl_CompliantApplication
	case PASSWORDCHANGE:
		return beta.ConditionalAccessGrantControl_PasswordChange
	default:
		return ""
	}
}

func updateEntities(cond *beta.ConditionalAccessConditionSet, entities []Entity) {
	includeUsers := []string{}
	excludeUsers := []string{}
	includeGroups := []string{}
	excludeGroups := []string{}
	includeRoles := []string{}
	excludeRoles := []string{}

	for _, entity := range entities {
		switch entity.Type {
		case USER:
			if entity.Include {
				includeUsers = append(includeUsers, entity.Name)
			} else {
				excludeUsers = append(excludeUsers, entity.Name)
			}
		case GROUP:
			if entity.Include {
				includeGroups = append(includeGroups, entity.Name)
			} else {
				excludeGroups = append(excludeGroups, entity.Name)
			}
		case ROLE:
			if entity.Include {
				includeRoles = append(includeRoles, entity.Name)
			} else {
				excludeRoles = append(excludeRoles, entity.Name)
			}
		}
	}

	if cond.Users != nil {
		cond.Users.IncludeUsers = &includeUsers
		cond.Users.ExcludeUsers = &excludeUsers
		cond.Users.IncludeGroups = &includeGroups
		cond.Users.ExcludeGroups = &excludeGroups
		cond.Users.IncludeRoles = &includeRoles
		cond.Users.ExcludeRoles = &excludeRoles
	}
}

func updateResources(cond *beta.ConditionalAccessConditionSet, resources []Resource) {
	includeApps := []string{}
	excludeApps := []string{}

	for _, resource := range resources {
		switch resource.Type {
		case APP:
			if resource.Include {
				includeApps = append(includeApps, resource.Name)
			} else {
				excludeApps = append(excludeApps, resource.Name)
			}
		}
	}

	cond.Applications.IncludeApplications = &includeApps
	cond.Applications.ExcludeApplications = &excludeApps
}

func updateConditions(cond *beta.ConditionalAccessConditionSet, conditions []Condition) {
	includePlatforms := []beta.ConditionalAccessDevicePlatform{}
	excludePlatforms := []beta.ConditionalAccessDevicePlatform{}
	includeLocations := []string{}
	excludeLocations := []string{}
	clientAppTypes := []beta.ConditionalAccessClientApp{}

	for _, condition := range conditions {
		switch condition.Type {
		case PLATFORM:
			if condition.Include {
				includePlatforms = append(includePlatforms, stringToPlatform(condition.Name))
			} else {
				excludePlatforms = append(excludePlatforms, stringToPlatform(condition.Name))
			}
		case LOCATION:
			if condition.Include {
				includeLocations = append(includeLocations, condition.Name)
			} else {
				excludeLocations = append(excludeLocations, condition.Name)
			}
		case CLIENT_APP:
			clientAppTypes = append(clientAppTypes, stringToClientApp(condition.Name))
		}
	}

	if cond.Platforms != nil {
		cond.Platforms.IncludePlatforms = &includePlatforms
		cond.Platforms.ExcludePlatforms = &excludePlatforms
	}

	if cond.Locations != nil {
		cond.Locations.IncludeLocations = &includeLocations
		cond.Locations.ExcludeLocations = &excludeLocations
	}

	cond.ClientAppTypes = clientAppTypes
}

func stringToPlatform(platform string) beta.ConditionalAccessDevicePlatform {
	switch platform {
	case "android":
		return beta.ConditionalAccessDevicePlatform_Android
	case "iOS":
		return beta.ConditionalAccessDevicePlatform_IOS
	case "windows":
		return beta.ConditionalAccessDevicePlatform_Windows
	case "macOS":
		return beta.ConditionalAccessDevicePlatform_MacOS
	case "linux":
		return beta.ConditionalAccessDevicePlatform_Linux
	default:
		return beta.ConditionalAccessDevicePlatform_All
	}
}

func stringToClientApp(clientApp string) beta.ConditionalAccessClientApp {
	switch clientApp {
	case "all":
		return beta.ConditionalAccessClientApp_All
	case "browser":
		return beta.ConditionalAccessClientApp_Browser
	case "mobileAppsAndDesktopClients":
		return beta.ConditionalAccessClientApp_MobileAppsAndDesktopClients
	default:
		return beta.ConditionalAccessClientApp_All
	}
}
