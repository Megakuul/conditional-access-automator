from flask import Flask, jsonify, render_template, redirect, session, url_for, request, make_response, flash

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


# Error handling
@app.errorhandler(404)
def not_found_error(error):
    flash('Error 404: Page not found', 'error')
    return redirect(url_for('home'))

@app.errorhandler(500)
def internal_error(error):
    flash('Error 500: Internal server error', 'error')
    return redirect(url_for('home'))

@app.errorhandler(Exception)
def handle_exception(error):
    flash(f"An error occurred: {str(error)}", 'error')
    return redirect(url_for('home'))


@app.route('/')
def home():
    return render_template('home.html')

@app.route('/templates')
def templates():
    if 'user' not in session or not session['user'].get('access_token'):
        return redirect(url_for('login'))
    
    templates_variable = fetch_conditional_access()  # Fetch the templates data
    return render_template('templates.html', templates=templates_variable)


@app.route('/login')
def login():
    flow = _build_auth_code_flow(scopes=SCOPE)
    response = make_response(redirect(flow['auth_uri']))
    response.set_cookie('flow', str(flow))  # Store flow in a cookie
    return response

@app.route('/logout')
def logout():
    # Clear the session
    session.clear()

    # Redirect to Azure AD logout URL
    response = make_response(redirect(
        'https://login.microsoftonline.com/common/oauth2/v2.0/logout' +
        '?post_logout_redirect_uri=' + url_for('home', _external=True)
    ))

    # Delete any authentication-related cookies
    response.delete_cookie('access_token')
    response.delete_cookie('access_token_exp')
    response.delete_cookie('flow')

    return response


@app.route('/api/auth/callback')
def authorized():
    flow_cookie = request.cookies.get('flow')
    if not flow_cookie:
        flash('Login failed: Flow cookie is missing', 'error')
        return redirect(url_for('home'))

    try:
        cache = _load_cache()
        result = _build_msal_app(cache=cache).acquire_token_by_auth_code_flow(
            eval(flow_cookie), request.args
        )
    except Exception as e:
        flash(f"Authorization error: {str(e)}", 'error')
        return redirect(url_for('home'))

    if 'error' in result:
        flash(f"Login failure: {result.get('error_description')}", 'error')
        return redirect(url_for('home'))

    access_token = result['access_token']
    expires_in = result.get('expires_in')  # Lifetime in seconds
    expiration_timestamp = int(time.time()) + int(expires_in) if expires_in else None

    # Store user information in the session
    session['user'] = {
        'name': result.get('id_token_claims').get('name'),  # Ensure 'name' field exists
        'access_token': access_token
    }

    response = make_response(redirect(url_for('fetch_conditional_access')))
    response.set_cookie('access_token', access_token, httponly=True, secure=True)
    if expiration_timestamp:
        response.set_cookie('access_token_exp', str(expiration_timestamp), httponly=True, secure=True)

    _save_cache(cache)

    return redirect(url_for('home'))  # Redirect to fetch_conditional_access after success


@app.route('/api/fetch_conditional_access')
def fetch_conditional_access():
    access_token = request.cookies.get('access_token')
    expiration_timestamp = request.cookies.get('access_token_exp')

    if not access_token or not expiration_timestamp:
        return jsonify({'error': 'Authorization expired or missing'}), 401

    templates_url = os.getenv('TEMPLATES_API_URL')

    if not templates_url:
        return jsonify({'error': 'Templates API URL is not configured'}), 500

    cookies = {
        'access_token': access_token,
        'access_token_exp': expiration_timestamp
    }

    try:
        response = requests.get(templates_url, cookies=cookies)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f"Error fetching templates: {str(e)}"}), 500

    response_data = response.json()

    decoded_templates = {}
    for key, value in response_data.items():
        if isinstance(value, list) and len(value) == 1 and isinstance(value[0], str):
            value = value[0]
        
        if isinstance(value, str):
            try:
                decoded_templates[key] = base64.urlsafe_b64decode(value).decode('utf-8')
            except Exception as e:
                return jsonify({'error': f"Error decoding template for key '{key}': {str(e)}"}), 500

    return jsonify(decoded_templates)


@app.route('/api/apply/<template_data>', methods=['GET'])
def apply_template(template_data):
    try:
        decoded_template = base64.urlsafe_b64decode(template_data).decode('utf-8')
    except Exception as e:
        flash(f"Error decoding template data: {str(e)}", 'error')
        return redirect(url_for('home'))

    apply_url = os.getenv('APPLY_API_URL')

    if not apply_url:
        flash('Apply API URL is not configured.', 'error')
        return redirect(url_for('home'))

    payload = {'template': decoded_template}

    try:
        response = requests.post(apply_url, json=payload)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        flash(f"Error applying template: {str(e)}", 'error')
        return redirect(url_for('home'))

    return response.json()


@app.route('/api/format/<template_data>/<format_type>', methods=['GET'])
def format_template(template_data, format_type):
    try:
        decoded_template = base64.urlsafe_b64decode(template_data).decode('utf-8')
    except Exception as e:
        flash(f"Error decoding template data: {str(e)}", 'error')
        return redirect(url_for('home'))

    format_url = os.getenv('FORMAT_API_URL')

    if not format_url:
        flash('Format API URL is not configured.', 'error')
        return redirect(url_for('home'))

    payload = {
        'template': decoded_template,
        'format': format_type
    }

    try:
        response = requests.post(format_url, json=payload)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        flash(f"Error formatting template: {str(e)}", 'error')
        return redirect(url_for('home'))

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
    cache = msal.SerializableTokenCache()
    return cache

def _save_cache(cache):
    pass

if __name__ == '__main__':
    app.run()
