from flask import Flask, json, jsonify, render_template, redirect, session, url_for, request, make_response, flash

import sys
import msal
import time  # Import time module
import base64
import requests
from datetime import timedelta

import os
from dotenv import load_dotenv
load_dotenv()

if len(sys.argv) != 2:
    sys.stderr.write(f"Usage: caa-webserver [listener_port]\n")
    sys.exit(1)
port = int(sys.argv[1])

# Check if the app is bundled with PyInstaller
if getattr(sys, 'frozen', False):  
    base_path = sys._MEIPASS # Use the temporary folder where the files are extracted
else:
    base_path = os.path.abspath(".")

app = Flask(__name__,
            template_folder=os.path.join(base_path, 'templates'),
            static_folder=os.path.join(base_path, 'static'))
app.secret_key = os.getenv('FLASK_SESSION_SECRET')


app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=60)

@app.before_request
def make_session_permanent():
    session.permanent = True

CLIENT_ID = os.getenv('AZURE_CLIENT_ID')
CLIENT_SECRET = os.getenv('AZURE_CLIENT_SECRET')
AUTHORITY = os.getenv('AZURE_AUTHORITY')
REDIRECT_URI = os.getenv('AZURE_REDIRECT_URI')
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
        'name': result.get('id_token_claims').get('name'),
        'access_token': access_token,
        'expires_at': expiration_timestamp  # Store expiration timestamp in session
    }

    # Create a response that redirects to 'templates' and set cookies on it
    response = make_response(redirect(url_for('templates')))
    response.set_cookie('access_token', access_token, httponly=True)
    if expiration_timestamp:
        response.set_cookie('access_token_exp', str(expiration_timestamp), httponly=True)

    _save_cache(cache)

    return response  # Return the response with cookies set


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
        if e.response is not None:
            # Access the entire response
            response = e.response
            status_code = response.status_code
            headers = response.headers
            body = response.text  # Or response.content for raw bytes
            
            # Print or log the response details
            print("Exception occurred:", e)
            print("Status Code:", status_code)
            print("Headers:", headers)
            print("Body:", body)
            
            # Optionally, include the response body in your JSON response
            return jsonify({
                'error': f"Error fetching templates: {str(e)}",
                'status_code': status_code,
                'headers': dict(headers),
                'body': body
            }), 500
        else:
            # No response was received (e.g., network error)
            print("No response received:", e)
            return jsonify({'error': f"Error fetching templates: {str(e)}"}), 500

    response_data = response.json()

    #decoded_templates = {}
    #for key, value in response_data.items():
     #   if isinstance(value, list) and len(value) == 1 and isinstance(value[0], str):
      #      value = value[0]
        
      #  if isinstance(value, str):
      #      try:
      #          decoded_templates[key] = base64.urlsafe_b64decode(value).decode('utf-8')
      #      except Exception as e:
      #          return jsonify({'error': f"Error decoding template for key '{key}': {str(e)}"}), 500

    return jsonify(response_data)



@app.route('/api/apply', methods=['POST'])
def apply_template():
    # Call the function to log the call and extend the cookie
    #cookie_response = log_and_extend_cookie()
    
    # If the cookie extension returned an error, abort further execution
    #if cookie_response.status_code != 200:
     #   return cookie_response

    access_token = request.cookies.get('access_token')
    expiration_timestamp = request.cookies.get('access_token_exp')

    if not access_token or not expiration_timestamp:
        flash('Authorization expired or missing', 'error')
        return jsonify({'error': 'Authorization expired or missing'}), 401

    apply_url = os.getenv('APPLY_API_URL')

    if not apply_url:
        flash('Templates API URL is not configured.', 'error')
        return jsonify({'error': 'Templates API URL is not configured.'}), 500

    cookies = {
        'access_token': access_token,
        'access_token_exp': expiration_timestamp
    }

    # Get the JSON data from the request
    json_data = request.get_json()
    print(f"Received JSON data: {json_data}")

    # Encode the JSON data as base64 URL encoded string
    #json_str = json.dumps(json_data)
    json_str = json.dumps(json_data)  # Removes null characters if any
    print(f"Normal JSON data: {json_str}")
    base64_encoded_data = base64.urlsafe_b64encode(json_str.encode()).decode()
    print("base64_encoded_data: ", base64_encoded_data)
    
    # Prepare the body with the encoded JSON under the "template" key
    payload = {
        "template": base64_encoded_data
    }
    print("payload: ",payload)

    try:
        # Send the POST request with the body payload
        response = requests.post(apply_url, json=payload, cookies=cookies)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        if e.response is not None:
            response = e.response
            status_code = response.status_code
            headers = response.headers
            body = response.text
            print(f"Exception occurred: {e}")
            print("body: ", body)
            flash(f"Error fetching templates: {e}, body: {body}", 'error')
            return jsonify({
                'error': f"Error fetching templates: {str(e)}",
                'status_code': status_code,
                'headers': dict(headers),
                'body': body  # Include the body in the response
            }), status_code
        else:
            print(f"No response received: {e}")
            flash(f"Error fetching templates: {str(e)}", 'error')
            return jsonify({'error': f"Error fetching templates: {str(e)}"}), 500

    response_data = response.json()

    # Attach the cookie response to extend expiration
    response = jsonify(response_data)
    #response.set_cookie('access_token_exp', cookie_response.headers.get('Set-Cookie'))

    return response




@app.route('/api/destroy', methods=['POST'])
def destroy():
    access_token = request.cookies.get('access_token')
    expiration_timestamp = request.cookies.get('access_token_exp')

    if not access_token or not expiration_timestamp:
        return jsonify({'error': 'Authorization expired or missing'}), 401

    destroy_url = os.getenv('DESTROY_API_URL')

    if not destroy_url:
        return jsonify({'error': 'Templates API URL is not configured'}), 500
    
    json_data = request.get_json()
    print(f"Received JSON data: {json_data}")
    
    payload = {
        'template_id': json_data.get('template_id'),
    }

    cookies = {
        'access_token': access_token,
        'access_token_exp': expiration_timestamp
    }

    try:
        response = requests.post(destroy_url, cookies=cookies, json=payload)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        if e.response is not None:
            # Access the entire response
            response = e.response
            status_code = response.status_code
            headers = response.headers
            body = response.text  # Or response.content for raw bytes
            
            # Print or log the response details
            print("Exception occurred:", e)
            print("Status Code:", status_code)
            print("Headers:", headers)
            print("Body:", body)
            
            # Optionally, include the response body in your JSON response
            return jsonify({
                'error': f"Error fetching templates: {str(e)}",
                'status_code': status_code,
                'headers': dict(headers),
                'body': body
            }), 500
        else:
            # No response was received (e.g., network error)
            print("No response received:", e)
            return jsonify({'error': f"Error fetching templates: {str(e)}"}), 500

    response_data = response.json()

    return jsonify(response_data)





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
    app.run(port=port)