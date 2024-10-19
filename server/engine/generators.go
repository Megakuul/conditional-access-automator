package engine

import (
	"strconv"
)

// Generates the action condition based on a given grant controls map
func generateActionCondition(grant interface{}) (bool, ActionCondition) {
	action := false
	actionCondition := ActionCondition{}
	if g, ok := grant.(map[string]interface{}); ok {
		if operator, ok := g["operator"].(string); ok {
			action = true
			actionCondition.ChainOperator = operator
			if controls, ok := g["builtInControls"].([]interface{}); ok {
				for _, condition := range controls {
					if condStr, ok := condition.(string); ok {
            if condInt, err := strconv.Atoi(condStr); err == nil {
							actionCondition.Conditions = append(actionCondition.Conditions, ACTION_CONDITION(condInt))
            } else {
							return false, ActionCondition{}
            }
					} else {
            return false, ActionCondition{}
					}
				}
			}
		}
	}
	return action, actionCondition
}


func generateEntities(cond interface{}) []Entity {
	entities := []Entity{}
	if c, ok := cond.(map[string]interface{}); ok {
		if users, ok := c["users"].(map[string]interface{}); ok {
			// Handle excluded users
			if excludeUsers, ok := users["excludeUsers"].([]interface{}); ok {
				for _, entity := range excludeUsers {
					entities = append(entities, Entity{
						Include: false,
						Type:    USER,
						Name:    entity.(string),
					})
				}
			}
			// Handle included users
			if includeUsers, ok := users["includeUsers"].([]interface{}); ok {
				for _, entity := range includeUsers {
					entities = append(entities, Entity{
						Include: true,
						Type:    USER,
						Name:    entity.(string),
					})
				}
			}
			// Handle excluded groups
			if excludeGroups, ok := users["excludeGroups"].([]interface{}); ok {
				for _, entity := range excludeGroups {
					entities = append(entities, Entity{
						Include: false,
						Type:    GROUP,
						Name:    entity.(string),
					})
				}
			}
			// Handle included groups
			if includeGroups, ok := users["includeGroups"].([]interface{}); ok {
				for _, entity := range includeGroups {
					entities = append(entities, Entity{
						Include: true,
						Type:    GROUP,
						Name:    entity.(string),
					})
				}
			}
			// Handle excluded roles
			if excludeRoles, ok := users["excludeRoles"].([]interface{}); ok {
				for _, entity := range excludeRoles {
					entities = append(entities, Entity{
						Include: false,
						Type:    ROLE,
						Name:    entity.(string),
					})
				}
			}
			// Handle included roles
			if includeRoles, ok := users["includeRoles"].([]interface{}); ok {
				for _, entity := range includeRoles {
					entities = append(entities, Entity{
						Include: true,
						Type:    ROLE,
						Name:    entity.(string),
					})
				}
			}
		}
	}
	return entities
}

// Generates resources from the condition set map
func generateResources(cond interface{}) []Resource {
	resources := []Resource{}
	if c, ok := cond.(map[string]interface{}); ok {
		if applications, ok := c["applications"].(map[string]interface{}); ok {
			if excludeApps, ok := applications["excludeApplications"].([]interface{}); ok {
				for _, resource := range excludeApps {
					resources = append(resources, Resource{
						Include: false,
						Type:    APP,
						Name:    resource.(string),
					})
				}
			}
			if includeApps, ok := applications["includeApplications"].([]interface{}); ok {
				for _, resource := range includeApps {
					resources = append(resources, Resource{
						Include: true,
						Type:    APP,
						Name:    resource.(string),
					})
				}
			}
		}
	}
	return resources
}

func generateConditions(cond interface{}) []Condition {
	conditions := []Condition{}

	if c, ok := cond.(map[string]interface{}); ok {
		if platforms, ok := c["platforms"].(map[string]interface{}); ok {
			if excludePlatforms, ok := platforms["excludePlatforms"].([]interface{}); ok {
				for _, platform := range excludePlatforms {
					conditions = append(conditions, Condition{
						Include: false,
						Type:    PLATFORM,
						Name:    platform.(string),
					})
				}
			}
			if includePlatforms, ok := platforms["includePlatforms"].([]interface{}); ok {
				for _, platform := range includePlatforms {
					conditions = append(conditions, Condition{
						Include: true,
						Type:    PLATFORM,
						Name:    platform.(string),
					})
				}
			}
		}

		// Handling locations
		if locations, ok := c["locations"].(map[string]interface{}); ok {
			if excludeLocations, ok := locations["excludeLocations"].([]interface{}); ok {
				for _, location := range excludeLocations {
					conditions = append(conditions, Condition{
						Include: false,
						Type:    LOCATION,
						Name:    location.(string),
					})
				}
			}
			if includeLocations, ok := locations["includeLocations"].([]interface{}); ok {
				for _, location := range includeLocations {
					conditions = append(conditions, Condition{
						Include: true,
						Type:    LOCATION,
						Name:    location.(string),
					})
				}
			}
		}

		// Handling client app types
		if clientApps, ok := c["clientAppTypes"].([]interface{}); ok {
			for _, clientApp := range clientApps {
				conditions = append(conditions, Condition{
					Include: true,
					Type:    CLIENT_APP,
					Name:    clientApp.(string),
				})
			}
		}
	}
	return conditions
}

// Updates action condition to a map representing the grant controls
func updateActionCondition(grant map[string]interface{}, action bool, actionCondition ActionCondition) {
	if action {
		grant["operator"] = actionCondition.ChainOperator
		if len(actionCondition.Conditions) > 0 {
			grant["builtInControls"] = actionCondition.Conditions
		}
	} else {
		grant["operator"] = "OR"
		grant["builtInControls"] = []string{"block"}
	}
}

// Updates entities to the map condition set
func updateEntities(cond map[string]interface{}, entities []Entity) {
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
		if len(includeUsers) > 0 || len(excludeUsers) > 0 || len(includeGroups) > 0 || len(excludeGroups) > 0 || len(includeRoles) > 0 || len(excludeRoles) > 0 {
		if cond["users"] == nil {
			cond["users"] = map[string]interface{}{}
		}
		users := cond["users"].(map[string]interface{})
		if len(includeUsers) > 0 {
			users["includeUsers"] = includeUsers
		}
		if len(excludeUsers) > 0 {
			users["excludeUsers"] = excludeUsers
		}
		if len(includeGroups) > 0 {
			users["includeGroups"] = includeGroups
		}
		if len(excludeGroups) > 0 {
			users["excludeGroups"] = excludeGroups
		}
		if len(includeRoles) > 0 {
			users["includeRoles"] = includeRoles
		}
		if len(excludeRoles) > 0 {
			users["excludeRoles"] = excludeRoles
		}
	}
}

// Updates resources to the map condition set
func updateResources(cond map[string]interface{}, resources []Resource) {
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

	if len(includeApps) > 0 || len(excludeApps) > 0 {
		if cond["applications"] == nil {
			cond["applications"] = map[string]interface{}{}
		}
		applications := cond["applications"].(map[string]interface{})
		if len(includeApps) > 0 {
			applications["includeApplications"] = includeApps
		}
		if len(excludeApps) > 0 {
			applications["excludeApplications"] = excludeApps
		}
	}
}

func updateConditions(cond map[string]interface{}, conditions []Condition) {
	includePlatforms := []string{}
	excludePlatforms := []string{}
	includeLocations := []string{}
	excludeLocations := []string{}
	clientAppTypes := []string{}

	for _, condition := range conditions {
		switch condition.Type {
		case PLATFORM:
			if condition.Include {
				includePlatforms = append(includePlatforms, condition.Name)
			} else {
				excludePlatforms = append(excludePlatforms, condition.Name)
			}
		case LOCATION:
			if condition.Include {
				includeLocations = append(includeLocations, condition.Name)
			} else {
				excludeLocations = append(excludeLocations, condition.Name)
			}
		case CLIENT_APP:
			clientAppTypes = append(clientAppTypes, condition.Name)
		}
	}

	if len(includePlatforms) > 0 || len(excludePlatforms) > 0 {
		if cond["platforms"] == nil {
			cond["platforms"] = map[string]interface{}{}
		}
		platforms := cond["platforms"].(map[string]interface{})
		if len(includePlatforms) > 0 {
			platforms["includePlatforms"] = includePlatforms
		}
		if len(excludePlatforms) > 0 {
			platforms["excludePlatforms"] = excludePlatforms
		}
	}

	// Update locations
	if len(includeLocations) > 0 || len(excludeLocations) > 0 {
		if cond["locations"] == nil {
			cond["locations"] = map[string]interface{}{}
		}
		locations := cond["locations"].(map[string]interface{})
		if len(includeLocations) > 0 {
			locations["includeLocations"] = includeLocations
		}
		if len(excludeLocations) > 0 {
			locations["excludeLocations"] = excludeLocations
		}
	}

	// Update client apps
	if len(clientAppTypes) > 0 {
		cond["clientAppTypes"] = clientAppTypes
	}
}
