from flask import Flask, render_template, redirect, url_for, session, request
import msal
import requests
from flask_session import Session  # Import Flask-Session

app = Flask(__name__)
app.secret_key = 'your_secure_secret_key'  # Replace with your Flask app's secret key

# Configure server-side session
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

CLIENT_ID = '870ea751-cb49-4c3b-822e-ec31ee665ffa'
CLIENT_SECRET = 'vTq8Q~arhOxdBKhjKWYxq3K0S5AcPBuZ0FM14aOx'  # Replace with your client secret
AUTHORITY = 'https://login.microsoftonline.com/eab1298d-e619-4d4c-9804-b028a0d97e52'
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
    session['flow'] = _build_auth_code_flow(scopes=SCOPE)
    print("Flow initiated:", session['flow'])
    return redirect(session['flow']['auth_uri'])

@app.route('/logout')
def logout():
    session.clear()
    return redirect(
        'https://login.microsoftonline.com/common/oauth2/v2.0/logout' +
        '?post_logout_redirect_uri=' + url_for('index', _external=True)
    )


from datetime import datetime, timedelta
import time  # Import time module

@app.route('/api/auth/callback')
def authorized():
    print("Session flow in callback:", session.get('flow'))
    cache = _load_cache()
    result = _build_msal_app(cache=cache).acquire_token_by_auth_code_flow(
        session.get('flow', {}), request.args
    )
    if 'error' in result:
        return "Login failure: " + result.get('error_description')
    
    session['user'] = result.get('id_token_claims')
    _save_cache(cache)
    session['access_token'] = result['access_token']
    
    # Calculate the expiration UNIX timestamp using 'expires_in'
    expires_in = result.get('expires_in')  # Lifetime in seconds
    if expires_in:
        expiration_timestamp = int(time.time()) + int(expires_in)
        session['expiration_timestamp'] = expiration_timestamp
        print(f"Access token expires at (UNIX timestamp): {expiration_timestamp}")
    else:
        print("No 'expires_in' field in token response.")
    
    return redirect(url_for('fetch_conditional_access'))



@app.route('/fetch_conditional_access')
def fetch_conditional_access():
    access_token = session.get('access_token', None)
    if not access_token:
        return redirect(url_for('login'))
    
    # Retrieve the expiration UNIX timestamp from the session
    expiration_timestamp = session.get('expiration_timestamp', None)
    if expiration_timestamp:
        print(f"Access token expires at (UNIX timestamp): {expiration_timestamp}")
    
    # Use the access token in your function
    print("Access token:", access_token)

    #TODO: receive templates from go backend, send to frontend

    return "Access token used in fetch_conditional_access function."


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
    if session.get('token_cache'):
        cache.deserialize(session['token_cache'])
    return cache

def _save_cache(cache):
    if cache.has_state_changed:
        session['token_cache'] = cache.serialize()

if __name__ == '__main__':
    app.run()
