from msgraph.core import GraphClient
from msgraph.generated.models.conditional_access_policy import ConditionalAccessPolicy
from msgraph.generated.models.conditional_access_policy_state import ConditionalAccessPolicyState
from msgraph.generated.models.conditional_access_condition_set import ConditionalAccessConditionSet
from msgraph.generated.models.conditional_access_client_app import ConditionalAccessClientApp
from msgraph.generated.models.conditional_access_applications import ConditionalAccessApplications
from msgraph.generated.models.conditional_access_users import ConditionalAccessUsers
from msgraph.generated.models.conditional_access_locations import ConditionalAccessLocations
from msgraph.generated.models.conditional_access_grant_controls import ConditionalAccessGrantControls
from msgraph.generated.models.conditional_access_grant_control import ConditionalAccessGrantControl

async def generate_client(auth_token):
    scopes = ['Policy.ReadWrite.ConditionalAccess']

    # Multi-tenant apps can use "common",
    # single-tenant apps must use the tenant ID from the Azure portal
    tenant_id = 'common'

    # Values from app registration
    client_id = '870ea751-cb49-4c3b-822e-ec31ee665ffa'
    client_secret = 'vTq8Q~arhOxdBKhjKWYxq3K0S5AcPBuZ0FM14aOx'
    redirect_uri = 'http://localhost:5000/api/auth/callback'

    # azure.identity.aio
    credential = AuthorizationCodeCredential(
        tenant_id=tenant_id,
        client_id=client_id,
        authorization_code=auth_token,
        redirect_uri=redirect_uri,
        client_secret=client_secret)

    graph_client = GraphServiceClient(credential, scopes)

    request_body = ConditionalAccessPolicy(
        display_name = "Access to EXO requires MFA",
        state = ConditionalAccessPolicyState.Enabled,
        conditions = ConditionalAccessConditionSet(
            client_app_types = [
                ConditionalAccessClientApp.MobileAppsAndDesktopClients,
                ConditionalAccessClientApp.Browser,
            ],
            applications = ConditionalAccessApplications(
                include_applications = [
                    "00000002-0000-0ff1-ce00-000000000000",
                ],
            ),
            users = ConditionalAccessUsers(
                include_groups = [
                    "ba8e7ded-8b0f-4836-ba06-8ff1ecc5c8ba",
                ],
            ),
            locations = ConditionalAccessLocations(
                include_locations = [
                    "All",
                ],
                exclude_locations = [
                    "AllTrusted",
                ],
            ),
        ),
        grant_controls = ConditionalAccessGrantControls(
            operator = "OR",
            built_in_controls = [
                ConditionalAccessGrantControl.Mfa,
            ],
        ),
    )

    result = await graph_client.identity.conditional_access.policies.post(request_body)


generate_client("")
