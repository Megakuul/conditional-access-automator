package engine

// Generates the action condition based on a given grant controls map
func generateActionCondition(grant map[string]interface{}) (bool, ActionCondition) {
	action := false
	actionCondition := ActionCondition{}
	if grant != nil {
		if operator, ok := grant["operator"].(string); ok {
			action = true
			actionCondition.ChainOperator = operator
			if controls, ok := grant["builtInControls"].([]interface{}); ok {
				for _, condition := range controls {			
					actionCondition.Conditions = append(actionCondition.Conditions, ACTION_CONDITION(condition.(int)))
				}
			}
		}
	}
	return action, actionCondition
}

// Generates entities from the condition set map
func generateEntities(cond map[string]interface{}) []Entity {
	entities := []Entity{}
	if users, ok := cond["users"].(map[string]interface{}); ok {
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
		// Repeat the same for groups and roles
	}
	return entities
}

// Generates resources from the condition set map
func generateResources(cond map[string]interface{}) []Resource {
	resources := []Resource{}
	if applications, ok := cond["applications"].(map[string]interface{}); ok {
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
	return resources
}

// Generates conditions from the condition set map
func generateConditions(cond map[string]interface{}) []Condition {
	conditions := []Condition{}
	if platforms, ok := cond["platforms"].(map[string]interface{}); ok {
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
	// Repeat for locations and client apps
	return conditions
}

// Updates action condition to a map representing the grant controls
func updateActionCondition(grant map[string]interface{}, action bool, actionCondition ActionCondition) {
	if action {
		grant["operator"] = actionCondition.ChainOperator
		grant["builtInControls"] = actionCondition.Conditions
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
	if cond["users"] == nil {
		cond["users"] = map[string]interface{}{}
	}
	users := cond["users"].(map[string]interface{})
	users["includeUsers"] = includeUsers
	users["excludeUsers"] = excludeUsers
	users["includeGroups"] = includeGroups
	users["excludeGroups"] = excludeGroups
	users["includeRoles"] = includeRoles
	users["excludeRoles"] = excludeRoles
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
	if cond["applications"] == nil {
		cond["applications"] = map[string]interface{}{}
	}
	applications := cond["applications"].(map[string]interface{})
	applications["includeApplications"] = includeApps
	applications["excludeApplications"] = excludeApps
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

	// Update platforms
	if cond["platforms"] == nil {
		cond["platforms"] = map[string]interface{}{}
	}
	platforms := cond["platforms"].(map[string]interface{})
	platforms["includePlatforms"] = includePlatforms
	platforms["excludePlatforms"] = excludePlatforms

	// Update locations
	if cond["locations"] == nil {
		cond["locations"] = map[string]interface{}{}
	}
	locations := cond["locations"].(map[string]interface{})
	locations["includeLocations"] = includeLocations
	locations["excludeLocations"] = excludeLocations

	// Update client apps
	cond["clientAppTypes"] = clientAppTypes
}
