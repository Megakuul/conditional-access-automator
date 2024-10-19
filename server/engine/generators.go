package engine

import "github.com/microsoftgraph/msgraph-sdk-go/models"

func generateEntities(cond models.ConditionalAccessConditionSetable) []Entity {
	entities := []Entity{}

	if cond.GetUsers() != nil {
		if cond.GetUsers().GetExcludeUsers() != nil {
			for _, entity := range cond.GetUsers().GetExcludeUsers() {
				entities = append(entities, Entity{
					Include: false,
					Type:    USER,
					Name:    entity,
				})
			}
		}

		if cond.GetUsers().GetIncludeUsers() != nil {
			for _, entity := range cond.GetUsers().GetIncludeUsers() {
				entities = append(entities, Entity{
					Include: true,
					Type:    USER,
					Name:    entity,
				})
			}
		}

		if cond.GetUsers().GetExcludeGroups() != nil {
			for _, entity := range cond.GetUsers().GetExcludeGroups() {
				entities = append(entities, Entity{
					Include: false,
					Type:    GROUP,
					Name:    entity,
				})
			}
		}

		if cond.GetUsers().GetIncludeGroups() != nil {
			for _, entity := range cond.GetUsers().GetIncludeGroups() {
				entities = append(entities, Entity{
					Include: true,
					Type:    GROUP,
					Name:    entity,
				})
			}
		}

		if cond.GetUsers().GetExcludeRoles() != nil {
			for _, entity := range cond.GetUsers().GetExcludeRoles() {
				entities = append(entities, Entity{
					Include: false,
					Type:    ROLE,
					Name:    entity,
				})
			}
		}

		if cond.GetUsers().GetIncludeRoles() != nil {
			for _, entity := range cond.GetUsers().GetIncludeRoles() {
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

func generateResources(cond models.ConditionalAccessConditionSetable) []Resource {
	resources := []Resource{}

	if cond.GetApplications() != nil {
		if cond.GetApplications().GetExcludeApplications() != nil {
			for _, resource := range cond.GetApplications().GetExcludeApplications() {
				resources = append(resources, Resource{
					Include: false,
					Type:    APP,
					Name:    resource,
				})
			}
		}

		if cond.GetApplications().GetIncludeApplications() != nil {
			for _, resource := range cond.GetApplications().GetIncludeApplications() {
				resources = append(resources, Resource{
					Include: true,
					Type:    APP,
					Name:    resource,
				})
			}
		}
	}

	return resources
}

func generateConditions(cond models.ConditionalAccessConditionSetable) []Condition {
	conditions := []Condition{}

	if cond.GetPlatforms() != nil {
		if cond.GetPlatforms().GetExcludePlatforms() != nil {
			for _, platform := range cond.GetPlatforms().GetExcludePlatforms() {
				conditions = append(conditions, Condition{
					Include: false,
					Type:    PLATFORM,
					Name:    platform.String(),
				})
			}
		}

		if cond.GetPlatforms().GetIncludePlatforms() != nil {
			for _, platform := range cond.GetPlatforms().GetIncludePlatforms() {
				conditions = append(conditions, Condition{
					Include: true,
					Type:    PLATFORM,
					Name:    platform.String(),
				})
			}
		}
	}

	if cond.GetLocations() != nil {
		if cond.GetLocations().GetExcludeLocations() != nil {
			for _, location := range cond.GetLocations().GetExcludeLocations() {
				conditions = append(conditions, Condition{
					Include: false,
					Type:    LOCATION,
					Name:    location,
				})
			}
		}

		if cond.GetLocations().GetIncludeLocations() != nil {
			for _, location := range cond.GetLocations().GetIncludeLocations() {
				conditions = append(conditions, Condition{
					Include: true,
					Type:    LOCATION,
					Name:    location,
				})
			}
		}
	}

	if cond.GetClientAppTypes() != nil {
		for _, clientapp := range cond.GetClientAppTypes() {
			conditions = append(conditions, Condition{
				Include: true,
				Type:    CLIENT_APP,
				Name:    clientapp.String(),
			})
		}
	}

	return conditions
}

func updateEntities(cond models.ConditionalAccessConditionSetable, entities []Entity) {
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

	if cond.GetUsers() != nil {
		cond.GetUsers().SetIncludeUsers(includeUsers)
		cond.GetUsers().SetExcludeUsers(excludeUsers)
		cond.GetUsers().SetIncludeGroups(includeGroups)
		cond.GetUsers().SetExcludeGroups(excludeGroups)
		cond.GetUsers().SetIncludeRoles(includeRoles)
		cond.GetUsers().SetExcludeRoles(excludeRoles)
	}
}

func updateResources(cond models.ConditionalAccessConditionSetable, resources []Resource) {
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

	if cond.GetApplications() != nil {
		cond.GetApplications().SetIncludeApplications(includeApps)
		cond.GetApplications().SetExcludeApplications(excludeApps)
	}
}


func stringToPlatform(platform string) models.ConditionalAccessDevicePlatform {
	switch platform {
	case "android":
		return models.ANDROID_CONDITIONALACCESSDEVICEPLATFORM
	case "iOS":
		return models.IOS_CONDITIONALACCESSDEVICEPLATFORM
	case "windows":
		return models.WINDOWS_CONDITIONALACCESSDEVICEPLATFORM
	case "macOS":
		return models.MACOS_CONDITIONALACCESSDEVICEPLATFORM
	case "linux":
		return models.LINUX_CONDITIONALACCESSDEVICEPLATFORM
	default:
		return models.UNKNOWNFUTUREVALUE_CONDITIONALACCESSDEVICEPLATFORM
	}
}

func stringToClientApp(clientApp string) models.ConditionalAccessClientApp {
	switch clientApp {
	case "all":
		return models.ALL_CONDITIONALACCESSCLIENTAPP
	case "browser":
		return models.BROWSER_CONDITIONALACCESSCLIENTAPP
	case "mobileAppsAndDesktopClients":
		return models.MOBILEAPPSANDDESKTOPCLIENTS_CONDITIONALACCESSCLIENTAPP
	default:
		return models.UNKNOWNFUTUREVALUE_CONDITIONALACCESSCLIENTAPP
	}
}

func updateConditions(cond models.ConditionalAccessConditionSetable, conditions []Condition) {
	includePlatforms := []models.ConditionalAccessDevicePlatform{}
	excludePlatforms := []models.ConditionalAccessDevicePlatform{}
	includeLocations := []string{}
	excludeLocations := []string{}
	clientAppTypes := []models.ConditionalAccessClientApp{}

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

	if cond.GetPlatforms() != nil {
		cond.GetPlatforms().SetIncludePlatforms(includePlatforms)
		cond.GetPlatforms().SetExcludePlatforms(excludePlatforms)
	}

	if cond.GetLocations() != nil {
		cond.GetLocations().SetIncludeLocations(includeLocations)
		cond.GetLocations().SetExcludeLocations(excludeLocations)
	}

	cond.SetClientAppTypes(clientAppTypes)
}
