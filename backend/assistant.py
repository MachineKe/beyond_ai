from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

app = Flask(__name__)
CORS(app)  # Allow frontend to communicate with backend

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")


AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
DEPLOYMENT_NAME = "gpt-4o"  # Update this with your deployment name

# Set OpenAI client for Azure
client = openai.AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version="2024-02-01",  # Ensure this is the correct API version
)


@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":  # Handle CORS preflight request
        return jsonify({"message": "CORS preflight successful"}), 200

    try:
        data = request.get_json()
        print("Received request data:", data)  # Debugging

        if not data or "message" not in data:
            return jsonify({"error": "Message is required"}), 400

        user_message = data["message"]

        # Call Azure OpenAI API
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,  # Use your Azure deployment name
            messages=[{"role": "user", "content": user_message}],
        )

        bot_response = response.choices[0].message.content
        print("Azure OpenAI API response:", bot_response)  # Debugging

        return jsonify({"response": bot_response})

    except openai.OpenAIError as e:
        print("Azure OpenAI API error:", str(e))  # Debugging
        return jsonify({"error": "Azure OpenAI API error", "details": str(e)}), 500

    except Exception as e:
        print("General error:", str(e))  # Debugging
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@app.after_request
def handle_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


if __name__ == "__main__":
    app.run(debug=True, port=5001, use_reloader=False)
