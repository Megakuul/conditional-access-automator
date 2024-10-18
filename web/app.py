from flask import Flask, render_template, redirect, url_for, request, make_response
import msal
import time  # Import time module
import base64
import requests

import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = 'your_secure_secret_key'  # Replace with your Flask app's secret key

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
AUTHORITY = os.getenv('AUTHORITY')
REDIRECT_URI = 'http://localhost:5000/api/auth/callback'
SCOPE = ['Policy.ReadWrite.ConditionalAccess', 'Policy.Read.All']

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/templates')
def templates():
    return render_template('templates.html')

@app.route('/login')
def login():
    flow = _build_auth_code_flow(scopes=SCOPE)
    response = make_response(redirect(flow['auth_uri']))
    response.set_cookie('flow', str(flow))  # Store flow in a cookie
    return response

@app.route('/logout')
def logout():
    response = make_response(redirect(
        'https://login.microsoftonline.com/common/oauth2/v2.0/logout' +
        '?post_logout_redirect_uri=' + url_for('index', _external=True)
    ))
    response.delete_cookie('access_token')
    response.delete_cookie('access_token_exp')
    response.delete_cookie('flow')
    return response

@app.route('/api/auth/callback')
def authorized():
    flow_cookie = request.cookies.get('flow')
    if not flow_cookie:
        return redirect(url_for('login'))

    cache = _load_cache()
    result = _build_msal_app(cache=cache).acquire_token_by_auth_code_flow(
        eval(flow_cookie), request.args
    )

    if 'error' in result:
        return "Login failure: " + result.get('error_description')

    access_token = result['access_token']
    expires_in = result.get('expires_in')  # Lifetime in seconds
    expiration_timestamp = int(time.time()) + int(expires_in) if expires_in else None

    response = make_response(redirect(url_for('fetch_conditional_access')))
    response.set_cookie('access_token', access_token, httponly=True, secure=True)
    if expiration_timestamp:
        response.set_cookie('access_token_exp', str(expiration_timestamp), httponly=True, secure=True)

    _save_cache(cache)
    
    return response


@app.route('/api/fetch_conditional_access')
def fetch_conditional_access():
    access_token = request.cookies.get('access_token')
    expiration_timestamp = request.cookies.get('access_token_exp')

    if not access_token or not expiration_timestamp:
        return redirect(url_for('login'))

    # URL from environment variable
    templates_url = os.getenv('TEMPLATES_API_URL')

    if not templates_url:
        return "Templates API URL is not configured."

    # Send GET request with cookies (access token and expiration timestamp)
    cookies = {
        'access_token': access_token,
        'access_token_exp': expiration_timestamp
    }

    print(cookies)

    try:
        # Make the request with cookies
        response = requests.get(templates_url, cookies=cookies)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return f"Error fetching templates: {str(e)}"

    # Parse JSON response
    response_data = response.json()

    # Decode base64 encoded templates
    decoded_templates = {}
    for key, value in response_data.items():
        print("Value: ", value)

        if isinstance(value, list) and len(value) == 1 and isinstance(value[0], str):
            # Extract the string from the list if it's a list with one element
            value = value[0]
        
        if isinstance(value, str):  # Ensure that the value is a string before decoding
            try:
                decoded_templates[key] = base64.urlsafe_b64decode(value).decode('utf-8')
            except Exception as e:
                return f"Error decoding template for key '{key}': {str(e)}"
        else:
            print(f"Skipping key '{key}' because its value is not a valid string or list (type: {type(value)})")


    # Save decoded templates in a variable
    templates_variable = decoded_templates

    # Print or return the decoded templates for debugging purposes
    print("Decoded templates:", templates_variable)

    return "Templates fetched and decoded successfully."



@app.route('/api/apply', methods=['POST'])
def apply_template():
    # Extract the JSON data from the request
    data = request.json

    if 'template' not in data:
        return "Template not provided in the request body.", 400

    # Encode the 'template' field in base64 URL-safe format
    encoded_template = base64.urlsafe_b64encode(data['template'].encode('utf-8')).decode('utf-8')

    # URL from environment variable
    apply_url = os.getenv('APPLY_API_URL')

    if not apply_url:
        return "Apply API URL is not configured."

    # Construct the payload with the encoded template
    payload = {
        'template': encoded_template
    }

    try:
        # Send POST request with the payload
        response = requests.post(apply_url, json=payload)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return f"Error applying template: {str(e)}"

    # Return the success message or data from the apply response
    return response.json()


# New route for /format (POST request)
@app.route('/api/format', methods=['POST'])
def format_template():
    # Extract the JSON data from the request
    data = request.json

    if 'template' not in data or 'format' not in data:
        return "Both 'template' and 'format' must be provided in the request body.", 400

    # Encode the 'template' field in base64 URL-safe format
    encoded_template = base64.urlsafe_b64encode(data['template'].encode('utf-8')).decode('utf-8')

    # URL from environment variable
    format_url = os.getenv('FORMAT_API_URL')

    if not format_url:
        return "Format API URL is not configured."

    # Construct the payload with the encoded template and format
    payload = {
        'template': encoded_template,
        'format': data['format']
    }

    try:
        # Send POST request with the payload (no cookies needed)
        response = requests.post(format_url, json=payload)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return f"Error formatting template: {str(e)}"

    # Return the formatted string based on the requested format (JSON/YAML, etc.)
    return response.json()




def _build_msal_app(cache=None, authority=None):
    return msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=authority or AUTHORITY,
        client_credential=CLIENT_SECRET,
        token_cache=cache
    )

def _build_auth_code_flow(scopes=None, authority=None):
    return _build_msal_app(authority=authority).initiate_auth_code_flow(
        scopes or [],
        redirect_uri=REDIRECT_URI
    )

def _load_cache():
    # Dummy cache function. You can implement a more secure token cache system.
    cache = msal.SerializableTokenCache()
    return cache

def _save_cache(cache):
    # Dummy cache save function. Can be extended for server-side caching.
    pass

if __name__ == '__main__':
    app.run()
