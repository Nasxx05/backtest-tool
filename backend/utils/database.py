"""
Database utility functions.

This module handles connecting to PostgreSQL and running queries.
It provides simple helper functions so the rest of our code
doesn't need to worry about connection details.
"""

import psycopg2
import psycopg2.extras
from backend.config import Config


def get_connection():
    """
    Create and return a new database connection.

    Returns:
        A psycopg2 connection object. Remember to close it when done!

    Example:
        conn = get_connection()
        # ... do stuff ...
        conn.close()
    """
    return psycopg2.connect(Config.DATABASE_URL)


def execute_query(query, params=None, fetch=True):
    """
    Run a SQL query and optionally return results.

    This is our main helper for database operations. It handles
    opening/closing connections automatically.

    Args:
        query:  The SQL string to execute (use %s for parameters)
        params: Tuple of values to safely insert into the query
        fetch:  If True, return the query results. If False, just execute.

    Returns:
        List of dictionaries (one per row) if fetch=True, else None.

    Example:
        # Fetch all stocks
        rows = execute_query("SELECT * FROM assets WHERE asset_type = %s", ("stock",))

        # Insert a new asset (no need to fetch results)
        execute_query(
            "INSERT INTO assets (symbol, name, asset_type) VALUES (%s, %s, %s)",
            ("AAPL", "Apple Inc.", "stock"),
            fetch=False
        )
    """
    conn = get_connection()
    try:
        # RealDictCursor returns rows as dictionaries instead of tuples
        # So we get {"symbol": "AAPL"} instead of ("AAPL",)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query, params)

        if fetch:
            results = cursor.fetchall()
        else:
            results = None

        # Save changes to the database
        conn.commit()
        return results

    except Exception as error:
        # If something goes wrong, undo any partial changes
        conn.rollback()
        raise error

    finally:
        # Always close the connection, even if an error occurred
        conn.close()


def execute_many(query, data_list):
    """
    Run the same query many times with different data.

    This is much faster than calling execute_query() in a loop
    when inserting lots of rows (like historical price data).

    Args:
        query:     The SQL string with %s placeholders
        data_list: List of tuples, one per row to insert

    Example:
        # Insert 1000 price rows at once
        execute_many(
            "INSERT INTO price_data (asset_id, date, close_price) VALUES (%s, %s, %s)",
            [(1, "2024-01-01", 150.0), (1, "2024-01-02", 151.5), ...]
        )
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        psycopg2.extras.execute_batch(cursor, query, data_list, page_size=1000)
        conn.commit()
    except Exception as error:
        conn.rollback()
        raise error
    finally:
        conn.close()


def init_database():
    """
    Create all tables if they don't exist yet.

    Reads the schema.sql file and executes it. Safe to run
    multiple times (uses IF NOT EXISTS and ON CONFLICT DO NOTHING).
    """
    import os

    # Find the schema.sql file relative to this file's location
    schema_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "database", "schema.sql"
    )

    with open(schema_path, "r") as f:
        schema_sql = f.read()

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(schema_sql)
        conn.commit()
        print("Database tables created successfully!")
    except Exception as error:
        conn.rollback()
        print(f"Error creating tables: {error}")
        raise error
    finally:
        conn.close()
