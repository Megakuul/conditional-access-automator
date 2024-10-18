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
        decoded_templates[key] = base64.urlsafe_b64decode(value).decode('utf-8')

    # Save decoded templates in a variable
    templates_variable = decoded_templates

    # Print or return the decoded templates for debugging purposes
    print("Decoded templates:", templates_variable)

    return "Templates fetched and decoded successfully."


@app.route('/api/send_template')
def send_template():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return redirect(url_for('login'))

    expiration_timestamp = request.cookies.get('access_token_exp')
    if expiration_timestamp:
        print(f"Access token expires at (UNIX timestamp): {expiration_timestamp}")

    print("Access token:", access_token)
    return "Access token used in send_template function."

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
