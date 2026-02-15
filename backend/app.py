"""
Main Flask Application - Entry Point

This is where our backend server starts. It sets up Flask,
registers all our API routes, and configures CORS so the
React frontend can communicate with this server.

To run: python -m backend.app
"""

from flask import Flask
from flask_cors import CORS
from backend.config import Config


def create_app():
    """
    Create and configure the Flask application.

    We use a "factory function" pattern here. Instead of creating
    the app at the top level, we wrap it in a function. This makes
    testing easier and prevents issues with circular imports.

    Returns:
        A configured Flask app, ready to run.
    """
    # Create the Flask app
    app = Flask(__name__)

    # Load our configuration settings
    app.config.from_object(Config)

    # Enable CORS - this allows our React frontend (running on port 3000)
    # to make requests to this backend (running on port 5000)
    CORS(app, origins=Config.CORS_ORIGINS.split(","))

    # ----- Register API Routes -----
    # Each route "blueprint" handles a group of related endpoints
    from backend.routes.assets import assets_bp
    from backend.routes.backtest import backtest_bp
    from backend.routes.analytics import analytics_bp

    app.register_blueprint(assets_bp, url_prefix="/api/assets")
    app.register_blueprint(backtest_bp, url_prefix="/api/backtest")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    # ----- Health Check Endpoint -----
    @app.route("/api/health")
    def health_check():
        """Simple endpoint to verify the server is running."""
        return {"status": "ok", "message": "Backtest Tool API is running!"}

    return app


# ----- Run the Server -----
if __name__ == "__main__":
    app = create_app()
    port = int(Config.DB_PORT) if Config.DB_PORT else 5000
    # Use port 5000 for our backend
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
