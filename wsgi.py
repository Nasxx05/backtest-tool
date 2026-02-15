# Render uses this file to start the Flask server in production.
# Gunicorn is a production-grade WSGI server (much faster than
# Flask's built-in dev server).
#
# The command in render.yaml tells Render to run:
#   gunicorn backend.app:create_app()

from backend.app import create_app

# Create the app instance that Gunicorn will serve
app = create_app()
