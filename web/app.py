from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Basic route
@app.route('/')
def home():
    return render_template('index.html')

# Basic route
@app.route('/form')
def form():
    return render_template('form.html')

# Example route with parameter
@app.route('/greet/<name>')
def greet(name):
    return f"Hello, {name}!"

# Example route handling POST request
@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    return jsonify({"message": "Data received", "data": data})

# 404 error handler
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Page not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
